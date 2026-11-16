import type { DriverOrder } from './driverApi';

export type AvailableOrderListener = (order: any) => void;

class DriverWebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Set<AvailableOrderListener> = new Set();
  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;
  private isExplicitlyClosed: boolean = false;
  private isConnected: boolean = false;

  public connect() {
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
              const body = raw.slice(doubleNewlineIndex + 2).replace(/\0$/, '').trim();
              try {
                const parsed = JSON.parse(body);
                this.notifyListeners(parsed);
              } catch (e) {
                console.warn('Failed to parse driver STOMP message:', e);
              }
            }
          } else {
            try {
              const parsed = JSON.parse(raw);
              this.notifyListeners(parsed);
            } catch {
              // Not JSON
            }
          }
        }
      };

      this.socket.onerror = () => {
        // Silently handled to avoid browser console error noise
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        if (!this.isExplicitlyClosed) {
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, 5000);
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
    // Subscribe to driver available pool
    const subFrame = 'SUBSCRIBE\nid:sub-drivers-available\ndestination:/topic/drivers/available-orders\n\n\0';
    this.socket.send(subFrame);
  }

  public subscribeAvailableOrders(listener: AvailableOrderListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('Error in driver socket listener:', err);
      }
    });
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
    this.listeners.clear();
  }
}

export const driverWebSocket = new DriverWebSocketService();
export default driverWebSocket;
