import type { CustomerOrder } from '@/types';
import type { ChatMessage, SendMessagePayload } from './chatApi';

export type OrderLiveUpdateListener = (updatedOrder: Partial<CustomerOrder>) => void;
export type ChatLiveMessageListener = (message: ChatMessage) => void;

class OrderLiveTrackingWebSocketService {
  private socket: WebSocket | null = null;
  private currentOrderId: number | string | null = null;
  private orderListeners: Set<OrderLiveUpdateListener> = new Set();
  private chatListeners: Set<ChatLiveMessageListener> = new Set();
  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;
  private isExplicitlyClosed: boolean = false;
  private isConnected: boolean = false;

  public connect(orderId: number | string) {
    this.currentOrderId = orderId;
    this.isExplicitlyClosed = false;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      // Re-subscribe if order ID changed
      this.sendSubscriptionFrames();
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsUrl = isLocalhost ? 'ws://localhost:8080/ws' : `${protocol}//${window.location.host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        // Send STOMP CONNECT frame
        const connectFrame = 'CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0';
        this.socket?.send(connectFrame);

        // Heartbeat
        this.heartbeatTimer = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send('\n');
          }
        }, 15000);
      };

      this.socket.onmessage = (event) => {
        const raw = event.data;
        if (!raw || raw === '\n' || raw === '\r\n') return;

        if (typeof raw === 'string') {
          if (raw.startsWith('CONNECTED')) {
            this.sendSubscriptionFrames();
          } else if (raw.startsWith('MESSAGE')) {
            const doubleNewlineIndex = raw.indexOf('\n\n');
            if (doubleNewlineIndex !== -1) {
              const headersPart = raw.slice(0, doubleNewlineIndex);
              const body = raw.slice(doubleNewlineIndex + 2).replace(/\0$/, '').trim();
              try {
                const parsed = JSON.parse(body);
                if (headersPart.includes(`/topic/chat/`)) {
                  this.notifyChatListeners(parsed);
                } else {
                  this.notifyOrderListeners(parsed);
                }
              } catch (e) {
                console.warn('Failed to parse STOMP message:', e);
              }
            }
          } else {
            // Direct JSON payload
            try {
              const parsed = JSON.parse(raw);
              if (parsed.message && parsed.senderRole) {
                this.notifyChatListeners(parsed);
              } else {
                this.notifyOrderListeners(parsed);
              }
            } catch {
              // Not JSON
            }
          }
        }
      };

      this.socket.onerror = () => {
        // Silently handled to prevent browser console error noise
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        if (!this.isExplicitlyClosed) {
          this.reconnectTimer = setTimeout(() => {
            if (this.currentOrderId) {
              this.connect(this.currentOrderId);
            }
          }, 4000);
        }
      };
    } catch {
      // WS connection fallback
    }
  }

  private sendSubscriptionFrames() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.currentOrderId) {
      return;
    }
    // 1. Subscribe to order live updates: /topic/orders/{orderId}
    const orderSub = `SUBSCRIBE\nid:sub-order-${this.currentOrderId}\ndestination:/topic/orders/${this.currentOrderId}\n\n\0`;
    this.socket.send(orderSub);

    // 2. Subscribe to order chat channel: /topic/chat/{orderId}
    const chatSub = `SUBSCRIBE\nid:sub-chat-${this.currentOrderId}\ndestination:/topic/chat/${this.currentOrderId}\n\n\0`;
    this.socket.send(chatSub);
  }

  public subscribeOrderUpdates(listener: OrderLiveUpdateListener): () => void {
    this.orderListeners.add(listener);
    return () => {
      this.orderListeners.delete(listener);
    };
  }

  public subscribeChatMessages(listener: ChatLiveMessageListener): () => void {
    this.chatListeners.add(listener);
    return () => {
      this.chatListeners.delete(listener);
    };
  }

  private notifyOrderListeners(data: Partial<CustomerOrder>) {
    this.orderListeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('Error in order listener:', err);
      }
    });
  }

  private notifyChatListeners(data: ChatMessage) {
    this.chatListeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('Error in chat listener:', err);
      }
    });
  }

  public sendChatMessageViaWs(payload: SendMessagePayload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const body = JSON.stringify(payload);
      const sendFrame = `SEND\ndestination:/app/chat.send\ncontent-type:application/json\ncontent-length:${body.length}\n\n${body}\0`;
      this.socket.send(sendFrame);
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
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
    this.orderListeners.clear();
    this.chatListeners.clear();
    this.currentOrderId = null;
  }
}

export const orderLiveTrackingWs = new OrderLiveTrackingWebSocketService();
export default orderLiveTrackingWs;
