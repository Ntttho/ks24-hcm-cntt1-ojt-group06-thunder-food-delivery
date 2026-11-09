import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface SepayGenerateRequest {
  orderId: number;
  amount: number;
  orderInfo?: string;
}

export interface SepayGenerateResponse {
  orderId: number;
  amount: number;
  qrCodeUrl: string;
  bankName: string;
  bankBin: string;
  accountNo: string;
  accountName: string;
  paymentContent: string;
  status: string;
  expiresAt?: string;
}

export interface PaymentStatusResponse {
  paymentId: number;
  orderId: number;
  amount: number;
  paymentMethod: string;
  status: string; // 'SUCCESS' | 'PENDING' | 'FAILED'
  transactionRef?: string;
  paidAt?: string;
}

export const paymentApi = {
  /**
   * Sinh mã dynamic VietQR SePay theo đơn hàng
   */
  generateSepayQr: async (data: SepayGenerateRequest): Promise<ApiResponse<SepayGenerateResponse>> => {
    return apiClient.post(API_ENDPOINTS.PAYMENTS.SEPAY_GENERATE, data);
  },

  /**
   * Tra cứu trạng thái thanh toán đơn hàng (dành cho polling)
   */
  getPaymentStatus: async (orderId: number | string): Promise<ApiResponse<PaymentStatusResponse>> => {
    return apiClient.get(API_ENDPOINTS.PAYMENTS.ORDER_STATUS(orderId));
  },

  /**
   * Tạo giao dịch COD (tiền mặt khi nhận hàng)
   */
  createCod: async (
    orderId: number | string,
    amount: number,
    idempotencyKey?: string
  ): Promise<ApiResponse<PaymentStatusResponse>> => {
    return apiClient.post(API_ENDPOINTS.PAYMENTS.COD, null, {
      params: {
        orderId,
        amount,
        idempotencyKey,
      },
    });
  },
};

export default paymentApi;

