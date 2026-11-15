import { apiClient } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface ChatMessage {
  id: number;
  orderId?: number;
  senderId: number;
  shopId?: number;
  senderRole: string; // 'CUSTOMER' | 'DRIVER' | 'MERCHANT'
  message: string;
  isRead?: boolean;
  createdAt: string;
}

export interface SendMessagePayload {
  orderId?: number;
  senderId?: number;
  shopId?: number;
  senderRole?: string;
  message: string;
}

export const chatApi = {
  /**
   * Lấy toàn bộ lịch sử tin nhắn của một đơn hàng
   * GET /api/v1/chat/orders/{orderId}
   */
  getOrderChatHistory: async (orderId: number | string): Promise<ApiResponse<ChatMessage[]>> => {
    try {
      const res = await apiClient.get<ApiResponse<ChatMessage[]> | ChatMessage[]>(`/chat/orders/${orderId}`);
      if (res && 'data' in res && Array.isArray((res as any).data)) {
        return res as ApiResponse<ChatMessage[]>;
      }
      return {
        status: 200,
        message: 'Success',
        data: Array.isArray(res) ? res : [],
        timestamp: new Date().toISOString(),
      };
    } catch {
      // Local fallback in case backend is offline
      const localKey = `food_deli_chat_${orderId}`;
      const saved = localStorage.getItem(localKey);
      const parsed: ChatMessage[] = saved ? JSON.parse(saved) : [];
      return {
        status: 200,
        message: 'Fallback local storage',
        data: parsed,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Gửi tin nhắn mới
   * POST /api/v1/chat
   */
  sendMessage: async (payload: SendMessagePayload): Promise<ApiResponse<ChatMessage>> => {
    try {
      const res = await apiClient.post<ApiResponse<ChatMessage> | ChatMessage>('/chat', payload);
      if (res && 'data' in res && (res as any).data) {
        return res as ApiResponse<ChatMessage>;
      }
      return {
        status: 200,
        message: 'Success',
        data: res as unknown as ChatMessage,
        timestamp: new Date().toISOString(),
      };
    } catch {
      // Offline / Local save fallback
      const localKey = `food_deli_chat_${payload.orderId}`;
      const saved = localStorage.getItem(localKey);
      const parsed: ChatMessage[] = saved ? JSON.parse(saved) : [];
      const newMsg: ChatMessage = {
        id: Date.now(),
        orderId: payload.orderId,
        senderId: payload.senderId || 1,
        senderRole: payload.senderRole || 'CUSTOMER',
        message: payload.message,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      parsed.push(newMsg);
      localStorage.setItem(localKey, JSON.stringify(parsed));
      return {
        status: 200,
        message: 'Saved to local',
        data: newMsg,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Lấy lịch sử chat của một quán ăn (Chat tư vấn trước đơn)
   * GET /api/v1/chat/shops/{shopId}
   */
  getShopChatHistory: async (shopId: number | string): Promise<ApiResponse<ChatMessage[]>> => {
    try {
      const res = await apiClient.get<ApiResponse<ChatMessage[]> | ChatMessage[]>(`/chat/shops/${shopId}`);
      if (res && 'data' in res && Array.isArray((res as any).data)) {
        return res as ApiResponse<ChatMessage[]>;
      }
      return {
        status: 200,
        message: 'Success',
        data: Array.isArray(res) ? res : [],
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 200,
        message: 'Fallback empty list',
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Lấy số lượng tin nhắn chưa đọc của đơn hàng
   * GET /api/v1/chat/orders/{orderId}/unread-count?role=CUSTOMER
   */
  getOrderUnreadCount: async (orderId: number | string, role: string = 'CUSTOMER'): Promise<number> => {
    try {
      const res = await apiClient.get<ApiResponse<number>>(`/chat/orders/${orderId}/unread-count`, {
        params: { role },
      });
      return Number(res?.data) || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Đánh dấu toàn bộ tin nhắn trong đơn hàng là đã đọc
   * PUT /api/v1/chat/orders/{orderId}/read?readerRole=CUSTOMER
   */
  markOrderChatAsRead: async (orderId: number | string, readerRole: string = 'CUSTOMER'): Promise<void> => {
    try {
      await apiClient.put(`/chat/orders/${orderId}/read`, null, {
        params: { readerRole },
      });
    } catch {
      // Non-blocking
    }
  },

  /**
   * Lấy số lượng tin nhắn chưa đọc của quán
   * GET /api/v1/chat/shops/{shopId}/unread-count?role=MERCHANT
   */
  getShopUnreadCount: async (shopId: number | string, role: string = 'MERCHANT'): Promise<number> => {
    try {
      const res = await apiClient.get<ApiResponse<number>>(`/chat/shops/${shopId}/unread-count`, {
        params: { role },
      });
      return Number(res?.data) || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Đánh dấu toàn bộ tin nhắn trong quán là đã đọc
   * PUT /api/v1/chat/shops/{shopId}/read?readerRole=MERCHANT
   */
  markShopChatAsRead: async (shopId: number | string, readerRole: string = 'MERCHANT'): Promise<void> => {
    try {
      await apiClient.put(`/chat/shops/${shopId}/read`, null, {
        params: { readerRole },
      });
    } catch {
      // Non-blocking
    }
  },
};
