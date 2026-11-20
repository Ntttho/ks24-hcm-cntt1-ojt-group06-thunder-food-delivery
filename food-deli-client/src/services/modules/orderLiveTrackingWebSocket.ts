import type { CustomerOrder } from '@/types';
import type { ChatMessage, SendMessagePayload } from './chatApi';

export interface DriverLiveLocationPayload {
  driverId: number;
  orderId: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmh?: number;
}

export type OrderLiveUpdateListener = (updatedOrder: Partial<CustomerOrder>) => void;
export type ChatLiveMessageListener = (message: ChatMessage) => void;
export type DriverLiveLocationListener = (location: DriverLiveLocationPayload) => void;
export type ChatReadReceiptListener = (data: { orderId?: number; shopId?: number; readerRole?: string; status?: string }) => void;

class OrderLiveTrackingWebSocketService {
  private socket: WebSocket | null = null;
  private subscribedOrders: Set<number | string> = new Set();
  private subscribedShops: Set<number | string> = new Set();
  private activeSubIds: Set<string> = new Set();

  private orderListeners: Set<OrderLiveUpdateListener> = new Set();
  private chatListeners: Set<ChatLiveMessageListener> = new Set();
  private shopChatListeners: Set<ChatLiveMessageListener> = new Set();
  private locationListeners: Set<DriverLiveLocationListener> = new Set();
  private readListeners: Set<ChatReadReceiptListener> = new Set();

  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;
  private isExplicitlyClosed: boolean = false;
  private isConnected: boolean = false;

  public connect(orderId?: number | string | null, shopId?: number | string | null) {
    if (orderId) this.subscribedOrders.add(orderId);
    if (shopId) this.subscribedShops.add(shopId);
    this.isExplicitlyClosed = false;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
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

                // Handle Read Receipts event separately
                if (headersPart.includes('/read') || parsed.status === 'READ') {
                  this.notifyReadListeners(parsed);
                } else if (headersPart.includes(`/location`)) {
                  this.notifyLocationListeners(parsed);
                } else if (headersPart.includes(`/topic/shop/`)) {
                  this.notifyShopChatListeners(parsed);
                  this.notifyChatListeners(parsed);
                } else if (headersPart.includes(`/topic/chat/`)) {
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
              if (parsed.latitude && parsed.longitude && parsed.driverId) {
                this.notifyLocationListeners(parsed);
              } else if (parsed.message && parsed.senderRole) {
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
        // Handled silently to prevent browser console error noise
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.activeSubIds.clear();
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        if (!this.isExplicitlyClosed) {
          this.reconnectTimer = setTimeout(() => {
            if (this.subscribedOrders.size > 0 || this.subscribedShops.size > 0) {
              this.connect();
            }
          }, 3500);
        }
      };
    } catch {
      // WS connection fallback
    }
  }

  private sendSubscriptionFrames() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    // 1. Subscribe to all active orders
    this.subscribedOrders.forEach((orderId) => {
      const orderSubId = `sub-order-${orderId}`;
      if (!this.activeSubIds.has(orderSubId)) {
        this.socket?.send(`SUBSCRIBE\nid:${orderSubId}\ndestination:/topic/orders/${orderId}\n\n\0`);
        this.activeSubIds.add(orderSubId);
      }

      const chatSubId = `sub-chat-${orderId}`;
      if (!this.activeSubIds.has(chatSubId)) {
        this.socket?.send(`SUBSCRIBE\nid:${chatSubId}\ndestination:/topic/chat/${orderId}\n\n\0`);
        this.activeSubIds.add(chatSubId);
      }

      const locSubId = `sub-loc-${orderId}`; // location
      if (!this.activeSubIds.has(locSubId)) {
        this.socket?.send(`SUBSCRIBE\nid:${locSubId}\ndestination:/topic/orders/${orderId}/location\n\n\0`);
        this.activeSubIds.add(locSubId);
      }
    });

    // 2. Subscribe to all active shop channels
    this.subscribedShops.forEach((shopId) => {
      const shopSubId = `sub-shop-${shopId}`;
      if (!this.activeSubIds.has(shopSubId)) {
        this.socket?.send(`SUBSCRIBE\nid:${shopSubId}\ndestination:/topic/shop/${shopId}\n\n\0`);
        this.activeSubIds.add(shopSubId);
      }
    });
  }

  public subscribeOrder(orderId: number | string): () => void {
    this.subscribedOrders.add(orderId);
    this.connect(orderId);
    return () => {
      this.subscribedOrders.delete(orderId);
      const chatSubId = `sub-chat-${orderId}`;
      if (this.socket && this.socket.readyState === WebSocket.OPEN && this.activeSubIds.has(chatSubId)) {
        this.socket.send(`UNSUBSCRIBE\nid:${chatSubId}\n\n\0`);
        this.activeSubIds.delete(chatSubId);
      }
    };
  }

  public subscribeShop(shopId: number | string): () => void {
    this.subscribedShops.add(shopId);
    this.connect(null, shopId);
    return () => {
      this.subscribedShops.delete(shopId);
      const shopSubId = `sub-shop-${shopId}`;
      if (this.socket && this.socket.readyState === WebSocket.OPEN && this.activeSubIds.has(shopSubId)) {
        this.socket.send(`UNSUBSCRIBE\nid:${shopSubId}\n\n\0`);
        this.activeSubIds.delete(shopSubId);
      }
    };
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

  public subscribeShopChatMessages(listener: ChatLiveMessageListener): () => void {
    this.shopChatListeners.add(listener);
    return () => {
      this.shopChatListeners.delete(listener);
    };
  }

  public subscribeDriverLocation(listener: DriverLiveLocationListener): () => void {
    this.locationListeners.add(listener);
    return () => {
      this.locationListeners.delete(listener);
    };
  }

  public subscribeReadReceipts(listener: ChatReadReceiptListener): () => void {
    this.readListeners.add(listener);
    return () => {
      this.readListeners.delete(listener);
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

  private notifyShopChatListeners(data: ChatMessage) {
    this.shopChatListeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('Error in shop chat listener:', err);
      }
    });
  }

  private notifyLocationListeners(data: DriverLiveLocationPayload) {
    this.locationListeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('Error in location listener:', err);
      }
    });
  }

  private notifyReadListeners(data: { orderId?: number; shopId?: number; readerRole?: string; status?: string }) {
    this.readListeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('Error in read listener:', err);
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

  public sendMarkReadViaWs(orderId?: number, shopId?: number, readerRole?: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const body = JSON.stringify({ orderId, shopId, readerRole });
      const sendFrame = `SEND\ndestination:/app/chat.markRead\ncontent-type:application/json\ncontent-length:${body.length}\n\n${body}\0`;
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
    this.activeSubIds.clear();
    this.subscribedOrders.clear();
    this.subscribedShops.clear();
  }
}

export const orderLiveTrackingWs = new OrderLiveTrackingWebSocketService();
export default orderLiveTrackingWs;
