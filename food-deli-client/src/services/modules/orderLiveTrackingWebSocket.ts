import type { CustomerOrder } from '@/types';
import type { ChatMessage, SendMessagePayload } from './chatApi';

// ============================================================================
// 1. ĐỊNH NGHĨA KIỂU HÀM LẮNG NGHE (LISTENER TYPES)
// ============================================================================

/**
 * Hàm nhận dữ liệu cập nhật trạng thái đơn hàng (Dành cho TASK 2 - Live Tracking)
 * Ví dụ: Khi đơn hàng đổi sang 'CONFIRMED' hay 'DELIVERING', hàm này sẽ được gọi.
 */
export type OrderLiveUpdateListener = (updatedOrder: Partial<CustomerOrder>) => void;

/**
 * Hàm nhận dữ liệu tin nhắn chat mới (Dành cho TASK 3 - Realtime Chat)
 * Ví dụ: Khi Quán hoặc Tài xế gửi tin nhắn mới, hàm này sẽ được gọi.
 */
export type ChatLiveMessageListener = (message: ChatMessage) => void;

// ============================================================================
// 2. CLASS DỊCH VỤ QUẢN LÝ WEBSOCKET (SERVICE CLASS)
// ============================================================================

/**
 * Lớp dịch vụ quản lý toàn bộ kết nối WebSocket thời gian thực (Real-time).
 * - Sử dụng giao thức STOMP chạy trên nền WebSocket chuẩn của trình duyệt.
 * - Tự động định tuyến qua API Gateway cổng 8080.
 * - Hỗ trợ Heartbeat (giữ kết nối sống) và Auto-Reconnect (tự kết nối lại khi rớt mạng).
 */
class OrderLiveTrackingWebSocketService {
  // Biến lưu đối tượng WebSocket gốc của trình duyệt
  private socket: WebSocket | null = null;

  // Lưu mã ID của đơn hàng đang được xem hiện tại (ví dụ: 10, 101,...)
  private currentOrderId: number | string | null = null;

  // Tập hợp (Set) chứa các hàm đang lắng nghe cập nhật đơn hàng (TASK 2)
  private orderListeners: Set<OrderLiveUpdateListener> = new Set();

  // Tập hợp (Set) chứa các hàm đang lắng nghe tin nhắn chat mới (TASK 3)
  private chatListeners: Set<ChatLiveMessageListener> = new Set();

  // Bộ đếm giờ gửi "nhịp tim" (Heartbeat) định kỳ để giữ kết nối không bị đóng
  private heartbeatTimer: any = null;

  // Bộ đếm giờ tự động thử kết nối lại khi bị mất mạng
  private reconnectTimer: any = null;

  // Cờ đánh dấu: Người dùng chủ động tắt (thoát trang) hay do mạng bị rớt ngoài ý muốn?
  private isExplicitlyClosed: boolean = false;

  // Cờ báo trạng thái: Đã kết nối thành công tới máy chủ hay chưa?
  private isConnected: boolean = false;

  // --------------------------------------------------------------------------
  // HÀM MỞ KẾT NỐI ĐẾN SERVER (CONNECT)
  // --------------------------------------------------------------------------
  public connect(orderId: number | string) {
    this.currentOrderId = orderId;
    this.isExplicitlyClosed = false; // Đặt lại cờ: không phải người dùng chủ động tắt

    // Nếu socket đã đang mở hoặc đang trong quá trình kết nối:
    // Chỉ cần đăng ký lại kênh (Subscribe) cho orderId mới mà không cần tạo socket mới
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.sendSubscriptionFrames();
      return;
    }

    // Xóa bộ đếm kết nối lại cũ nếu có
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Xác định giao thức: Nếu web chạy https: thì dùng wss:, chạy http: thì dùng ws:
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Đường dẫn kết nối luôn đi qua API Gateway cổng 8080 (/ws)
    // Gateway sẽ tự động chuyển tiếp gói tin tới chat-notification-service (cổng 8087)
    const wsUrl = isLocalhost ? 'ws://localhost:8080/ws' : `${protocol}//${window.location.host}/ws`;

    try {
      // 1. Khởi tạo đối tượng WebSocket chuẩn của trình duyệt
      this.socket = new WebSocket(wsUrl);

      // SỰ KIỆN 1: KHI KẾT NỐI VỪA MỞ THÀNH CÔNG (ONOPEN)
      this.socket.onopen = () => {
        this.isConnected = true;

        // Gửi gói tin bắt tay (Frame CONNECT) theo chuẩn giao thức STOMP
        const connectFrame = 'CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0';
        this.socket?.send(connectFrame);

        // Bật nhịp tim (Heartbeat): Cứ 15 giây gửi 1 ký tự xuống dòng '\n'
        // để báo cho server biết trình duyệt vẫn đang hoạt động, không bị ngắt kết nối
        this.heartbeatTimer = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send('\n');
          }
        }, 15000);
      };

      // SỰ KIỆN 2: KHI NHẬN ĐƯỢC DỮ LIỆU TỪ SERVER GỬI VỀ (ONMESSAGE)
      this.socket.onmessage = (event) => {
        const raw = event.data;
        // Bỏ qua nếu dữ liệu rỗng hoặc chỉ là tín hiệu nhịp tim
        if (!raw || raw === '\n' || raw === '\r\n') return;

        if (typeof raw === 'string') {
          // Trường hợp A: Server xác nhận đã kết nối STOMP thành công
          if (raw.startsWith('CONNECTED')) {
            // Ngay lập tức gửi các lệnh đăng ký kênh (Subscribe)
            this.sendSubscriptionFrames();
          }
          // Trường hợp B: Server gửi dữ liệu nội dung (Frame MESSAGE)
          else if (raw.startsWith('MESSAGE')) {
            const doubleNewlineIndex = raw.indexOf('\n\n');
            if (doubleNewlineIndex !== -1) {
              const headersPart = raw.slice(0, doubleNewlineIndex);
              // Lấy phần thân dữ liệu JSON (body) và loại bỏ ký tự kết thúc frame (\0)
              const body = raw.slice(doubleNewlineIndex + 2).replace(/\0$/, '').trim();
              try {
                const parsed = JSON.parse(body);

                // Nếu tin nhắn thuộc kênh Chat (/topic/chat/) -> Báo cho TASK 3
                if (headersPart.includes(`/topic/chat/`)) {
                  this.notifyChatListeners(parsed);
                }
                // Ngược lại nếu thuộc kênh Đơn hàng (/topic/orders/) -> Báo cho TASK 2
                else {
                  this.notifyOrderListeners(parsed);
                }
              } catch (e) {
                console.warn('Failed to parse STOMP message:', e);
              }
            }
          }
          // Trường hợp C: Dữ liệu dạng JSON trực tiếp (dự phòng)
          else {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.message && parsed.senderRole) {
                this.notifyChatListeners(parsed);
              } else {
                this.notifyOrderListeners(parsed);
              }
            } catch {
              // Bỏ qua nếu không phải JSON
            }
          }
        }
      };

      // SỰ KIỆN 3: XỬ LÝ LỖI (ONERROR)
      this.socket.onerror = () => {
        // Xử lý âm thầm để không làm tràn thông báo đỏ ở Console trình duyệt
      };

      // SỰ KIỆN 4: KHI KẾT NỐI BỊ ĐÓNG (ONCLOSE)
      this.socket.onclose = () => {
        this.isConnected = false;

        // Xóa bộ đếm nhịp tim vì kết nối đã đóng
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }

        // TỰ ĐỘNG KẾT NỐI LẠI (AUTO-RECONNECT):
        // Nếu không phải do người dùng chủ động tắt trang (isExplicitlyClosed = false)
        // thì hẹn giờ sau 4 giây sẽ tự động thử kết nối lại
        if (!this.isExplicitlyClosed) {
          this.reconnectTimer = setTimeout(() => {
            if (this.currentOrderId) {
              this.connect(this.currentOrderId);
            }
          }, 4000);
        }
      };
    } catch {
      // Bắt lỗi dự phòng nếu khởi tạo WebSocket thất bại
    }
  }

  // --------------------------------------------------------------------------
  // HÀM GỬI LỆNH ĐĂNG KÝ KÊNH (SUBSCRIBE CHANNELS)
  // --------------------------------------------------------------------------
  private sendSubscriptionFrames() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.currentOrderId) {
      return;
    }

    // 1. [TASK 2] Đăng ký kênh cập nhật tiến trình đơn hàng: /topic/orders/{orderId}
    // Khi Quán hoặc Shipper đổi trạng thái đơn, server sẽ bắn vào kênh này
    const orderSub = `SUBSCRIBE\nid:sub-order-${this.currentOrderId}\ndestination:/topic/orders/${this.currentOrderId}\n\n\0`;
    this.socket.send(orderSub);

    // 2. [TASK 3] Đăng ký kênh chat trao đổi của đơn hàng: /topic/chat/{orderId}
    // Khi Khách/Quán/Tài xế nhắn tin, server sẽ bắn vào kênh này
    const chatSub = `SUBSCRIBE\nid:sub-chat-${this.currentOrderId}\ndestination:/topic/chat/${this.currentOrderId}\n\n\0`;
    this.socket.send(chatSub);
  }

  // --------------------------------------------------------------------------
  // [TASK 2] HÀM CHO COMPONENT REACT ĐĂNG KÝ THEO DÕI ĐƠN HÀNG
  // --------------------------------------------------------------------------
  /**
   * Component OrderDetailPage.tsx sẽ gọi hàm này để lắng nghe trạng thái đơn.
   * @param listener Hàm callback sẽ nhận dữ liệu đơn hàng mới.
   * @returns Hàm hủy đăng ký (unsubscribe) để dọn dẹp khi thoát component.
   */
  public subscribeOrderUpdates(listener: OrderLiveUpdateListener): () => void {
    this.orderListeners.add(listener);
    // Trả về hàm hủy đăng ký để gọi trong return của useEffect
    return () => {
      this.orderListeners.delete(listener);
    };
  }

  // --------------------------------------------------------------------------
  // [TASK 3] HÀM CHO COMPONENT REACT ĐĂNG KÝ NHẬN TIN NHẮN CHAT
  // --------------------------------------------------------------------------
  /**
   * Component OrderChatDrawer.tsx sẽ gọi hàm này để nhận tin nhắn mới.
   * @param listener Hàm callback sẽ nhận tin nhắn chat mới.
   * @returns Hàm hủy đăng ký (unsubscribe)
   */
  public subscribeChatMessages(listener: ChatLiveMessageListener): () => void {
    this.chatListeners.add(listener);
    return () => {
      this.chatListeners.delete(listener);
    };
  }

  // --------------------------------------------------------------------------
  // HÀM NỘI BỘ: PHÁT DỮ LIỆU ĐẾN TẤT CẢ CÁC LISTENER ĐANG LẮNG NGHE
  // --------------------------------------------------------------------------

  // Phát cho các component đang theo dõi đơn hàng (TASK 2)
  private notifyOrderListeners(data: Partial<CustomerOrder>) {
    this.orderListeners.forEach((fn) => {
      try {
        fn(data); // Gọi callback truyền dữ liệu mới vào React State
      } catch (err) {
        console.error('Error in order listener:', err);
      }
    });
  }

  // Phát cho các component đang mở khung chat (TASK 3)
  private notifyChatListeners(data: ChatMessage) {
    this.chatListeners.forEach((fn) => {
      try {
        fn(data); // Gọi callback thêm tin nhắn mới vào danh sách chat
      } catch (err) {
        console.error('Error in chat listener:', err);
      }
    });
  }

  // --------------------------------------------------------------------------
  // [TASK 3] HÀM GỬI TIN NHẮN CHAT QUA WEBSOCKET STOMP (SEND FRAME)
  // --------------------------------------------------------------------------
  /**
   * Đóng gói tin nhắn thành Frame SEND chuẩn STOMP và gửi lên Server.
   * Đích đến: /app/chat.send (sẽ được ChatController bắt bằng @MessageMapping)
   */
  public sendChatMessageViaWs(payload: SendMessagePayload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const body = JSON.stringify(payload);
      // Tạo frame STOMP SEND với đầy đủ tiêu đề và nội dung JSON
      const sendFrame = `SEND\ndestination:/app/chat.send\ncontent-type:application/json\ncontent-length:${body.length}\n\n${body}\0`;
      this.socket.send(sendFrame);
    }
  }

  // --------------------------------------------------------------------------
  // HÀM NGẮT KẾT NỐI VÀ DỌN DẸP BỘ NHỚ (CLEANUP / DISCONNECT)
  // --------------------------------------------------------------------------
  /**
   * Được gọi khi người dùng rời khỏi trang chi tiết đơn hàng.
   * Giúp dọn dẹp kết nối, xóa bộ đếm giờ, chống rò rỉ RAM (Memory Leak).
   */
  public disconnect() {
    this.isExplicitlyClosed = true; // Đánh dấu là người dùng chủ động thoát, không tự kết nối lại nữa

    // Xóa bộ đếm kết nối lại
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Dừng gửi nhịp tim
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Đóng socket và hủy tham chiếu
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // Xóa sạch danh sách các hàm lắng nghe
    this.orderListeners.clear();
    this.chatListeners.clear();
    this.currentOrderId = null;
  }
}

// ============================================================================
// 3. XUẤT RA DƯỚI DẠNG SINGLETON (DUY NHẤT 1 THỂ HIỆN DÙNG CHUNG TOÀN ỨNG DỤNG)
// ============================================================================
export const orderLiveTrackingWs = new OrderLiveTrackingWebSocketService();
export default orderLiveTrackingWs;
