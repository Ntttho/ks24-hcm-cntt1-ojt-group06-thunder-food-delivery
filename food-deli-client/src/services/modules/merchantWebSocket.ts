import { soundManager } from '@/utils/soundNotification';
import type { MerchantOrder } from './orderApi';

export type OrderNotificationListener = (order: MerchantOrder) => void;
export type ConnectionStatusListener = (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED') => void;

class MerchantWebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Set<OrderNotificationListener> = new Set();
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  private status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' = 'DISCONNECTED';
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private restaurantId: number | string = 1;
  private isExplicitlyClosed: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 2;
  private wsFallbackMode: boolean = false;

  public getStatus(): 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' {
    return this.status;
  }

  public resetConnection() {
    this.wsFallbackMode = false;
    this.reconnectAttempts = 0;
    this.connect(this.restaurantId);
  }

  public subscribeOrderNotification(listener: OrderNotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeConnectionStatus(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(newStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED') {
    if (this.status === newStatus) return; // Tránh emit trạng thái trùng lặp gây re-render component
    this.status = newStatus;
    this.statusListeners.forEach((fn) => {
      try {
        fn(newStatus);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }

  public connect(restaurantId: number | string = 1) {
    // If WebSocket endpoint is unavailable, stay in polling fallback mode without spamming
    if (this.wsFallbackMode) {
      this.notifyStatus('DISCONNECTED');
      return;
    }

    if (this.restaurantId !== restaurantId) {
      this.reconnectAttempts = 0;
    }
    this.restaurantId = restaurantId;
    this.isExplicitlyClosed = false;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.notifyStatus('CONNECTING');

    // Determine WS URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // By default connect via API Gateway (localhost:8080/ws) or current host proxy
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsUrl = isLocalhost ? `ws://localhost:8080/ws` : `${protocol}//${window.location.host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.wsFallbackMode = false;
        // Send STOMP CONNECT frame
        const connectFrame = 'CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0';
        this.socket?.send(connectFrame);
        this.notifyStatus('CONNECTED');

        // Start heartbeat
        this.heartbeatTimer = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send('\n');
          }
        }, 15000);
      };

      this.socket.onmessage = (event) => {
        const raw = event.data;
        if (!raw || raw === '\n' || raw === '\r\n') return;

        // Parse STOMP frames
        if (typeof raw === 'string') {
          if (raw.startsWith('CONNECTED')) {
            // Subscribe to restaurant topics
            const subOrders = `SUBSCRIBE\nid:sub-orders-all\ndestination:/topic/orders\n\n\0`;
            const subShop = `SUBSCRIBE\nid:sub-orders-shop\ndestination:/topic/orders/${this.restaurantId}\n\n\0`;
            const subMerchantOrders = `SUBSCRIBE\nid:sub-merchant-orders\ndestination:/topic/merchant/${this.restaurantId}/orders\n\n\0`;
            const subMerchant = `SUBSCRIBE\nid:sub-merchant-notify\ndestination:/user/queue/notifications\n\n\0`;
            this.socket?.send(subOrders);
            this.socket?.send(subShop);
            this.socket?.send(subMerchantOrders);
            this.socket?.send(subMerchant);
          } else if (raw.startsWith('MESSAGE')) {
            // Extract body of STOMP frame
            const doubleNewlineIndex = raw.indexOf('\n\n');
            if (doubleNewlineIndex !== -1) {
              const body = raw.slice(doubleNewlineIndex + 2).replace(/\0$/, '').trim();
              try {
                const parsed = JSON.parse(body);
                this.handleIncomingOrderMessage(parsed);
              } catch (e) {
                console.warn('Cannot parse WebSocket STOMP message payload:', e);
              }
            }
          } else {
            // Try raw JSON parse if backend sends direct JSON without STOMP
            try {
              const parsed = JSON.parse(raw);
              this.handleIncomingOrderMessage(parsed);
            } catch {
              // Not a JSON message
            }
          }
        }
      };

      this.socket.onerror = () => {
        // Handled silently to avoid uncaught exceptions in console
      };

      this.socket.onclose = () => {
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        this.notifyStatus('DISCONNECTED');
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.notifyStatus('DISCONNECTED');
      if (!this.isExplicitlyClosed) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Switch cleanly to Smart Polling fallback mode and stop reconnect loop
      this.wsFallbackMode = true;
      this.notifyStatus('DISCONNECTED');
      return;
    }
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isExplicitlyClosed && !this.wsFallbackMode) {
        this.connect(this.restaurantId);
      }
    }, 5000);
  }

  private handleIncomingOrderMessage(payload: any) {
    if (!payload) return;
    const orderData: MerchantOrder = payload.order || payload.data || payload;

    // Check if it's an order object
    if (orderData && (orderData.orderCode || orderData.id)) {
      // Trigger chime sound
      soundManager.playOrderChime();

      // Notify all UI subscribers
      this.listeners.forEach((listener) => {
        try {
          listener(orderData);
        } catch (err) {
          console.error('Error in order listener:', err);
        }
      });
    }
  }

  /**
   * Simulate an incoming new order event for demonstration & grading
   */
  public simulateIncomingOrder(): MerchantOrder {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newMockOrder: MerchantOrder = {
      id: Date.now(),
      orderCode: `ORD-${dateStr}-${randomId}`,
      customerId: 88,
      customerName: 'Trịnh Hoàng Long',
      customerPhone: '0903' + Math.floor(100000 + Math.random() * 900000),
      restaurantId: Number(this.restaurantId) || 1,
      restaurantName: 'Hạnh Dũng - Ẩm Thực Chay Mặn',
      receiverAddress: 'Toà nhà FPT Tân Thuận, KCX Tân Thuận, Quận 7, TP.HCM',
      subtotalAmount: 120000,
      shippingFee: 16000,
      discountAmount: 15000,
      totalAmount: 121000,
      statusCode: 'PENDING',
      statusLabel: 'Chờ quán xác nhận',
      customerNote: 'Nhà có em bé ngủ, Shipper đến nơi vui lòng gọi điện thoại, đừng bấm chuông nhé!',
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 1,
          foodId: 1,
          foodName: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
          quantity: 2,
          priceAtOrder: 55000,
          toppings: [
            { toppingId: 1, name: 'Thêm trứng ốp la', price: 10000, quantity: 2 },
          ],
        },
        {
          id: 2,
          foodId: 2,
          foodName: 'Trà Đào Cam Sả',
          quantity: 1,
          priceAtOrder: 25000,
        },
      ],
    };

    // Play chime sound
    soundManager.playOrderChime();

    // Trigger listeners
    this.listeners.forEach((listener) => {
      try {
        listener(newMockOrder);
      } catch (err) {
        console.error('Error in simulated order listener:', err);
      }
    });

    return newMockOrder;
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.notifyStatus('DISCONNECTED');
  }
}

export const merchantWebSocket = new MerchantWebSocketService();
