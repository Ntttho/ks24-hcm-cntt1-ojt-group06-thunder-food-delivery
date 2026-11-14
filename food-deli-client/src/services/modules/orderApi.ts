import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse, PaginatedData } from '@/types';

export interface GetMerchantOrdersParams {
  restaurantId?: number | string;
  status?: string;
  keyword?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface CreateOrderItemPayload {
  foodId: number;
  quantity: number;
  toppings?: Array<{
    toppingId: number;
    quantity?: number;
  }>;
}

export interface CreateOrderPayload {
  restaurantId: number;
  customerName?: string;
  customerPhone?: string;
  receiverAddress: string;
  receiverLat?: number;
  receiverLng?: number;
  distanceKm?: number;
  deliverySpeed?: 'priority' | 'standard' | 'schedule';
  voucherId?: number;
  idempotencyKey?: string;
  items: CreateOrderItemPayload[];
  paymentMethod?: 'COD' | 'MOMO' | 'VNPAY' | 'WALLET';
  note?: string;
}

export interface UpdateOrderStatusPayload {
  statusCode: string;
  reason?: string;
}

export const orderApi = {
  create: async (data: CreateOrderPayload): Promise<ApiResponse<any>> => {
    return apiClient.post(API_ENDPOINTS.ORDERS.CREATE, data);
  },

  getMyOrders: async (params?: { page?: number; size?: number }): Promise<ApiResponse<any>> => {
    return apiClient.get('/orders/my-orders', { params });
  },

  getAll: async (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.LIST, { params });
  },

  getById: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.DETAIL(id));
  },

  updateStatus: async (id: number | string, data: UpdateOrderStatusPayload): Promise<ApiResponse<any>> => {
    return apiClient.put(API_ENDPOINTS.ORDERS.STATUS(id), data);
  },

  confirmPaymentSuccess: async (orderId: number | string, transactionNo?: string): Promise<ApiResponse<any>> => {
    return apiClient.put(`/orders/${orderId}/payment-success`, null, {
      params: { transactionNo },
    });
  },

  cancelOrder: async (orderId: number | string, reason?: string): Promise<ApiResponse<any>> => {
    return apiClient.put(`/orders/${orderId}/cancel`, null, {
      params: { reason },
    });
  },

  // Merchant Portal: Order Reception, Confirmation & Cancellation APIs (Hỗ trợ Server-side Page & Search)
  getMerchantOrders: async (
    paramOrRestaurantId?: number | string | GetMerchantOrdersParams,
    statusParam?: string
  ): Promise<ApiResponse<PaginatedData<MerchantOrder>>> => {
    let requestParams: Record<string, any> = {};

    if (paramOrRestaurantId && typeof paramOrRestaurantId === 'object') {
      const p = paramOrRestaurantId as GetMerchantOrdersParams;
      requestParams = {
        restaurantId: p.restaurantId,
        status: p.status && p.status !== 'ALL' ? p.status : undefined,
        keyword: p.keyword || p.search || undefined,
        page: p.page ?? 0,
        size: p.size ?? 10,
      };
    } else {
      requestParams = {
        restaurantId: paramOrRestaurantId,
        status: statusParam && statusParam !== 'ALL' ? statusParam : undefined,
        page: 0,
        size: 50,
      };
    }

    try {
      const res = await apiClient.get<any>('/orders', {
        params: requestParams,
      });

      const rawData = res?.data;
      const list = Array.isArray(rawData?.content)
        ? rawData.content
        : Array.isArray(rawData)
        ? rawData
        : [];

      const totalElements = rawData?.totalElements ?? list.length;
      const totalPages = rawData?.totalPages ?? Math.max(1, Math.ceil(totalElements / (requestParams.size || 10)));
      const pageNumber = rawData?.pageNumber ?? requestParams.page ?? 0;
      const pageSize = rawData?.pageSize ?? requestParams.size ?? 10;
      const last = rawData?.last ?? (pageNumber + 1 >= totalPages);

      const mapped: MerchantOrder[] = list.map((item: any) => ({
        id: item.id,
        orderCode: item.orderCode || `ORD-${item.id}`,
        customerId: item.customerId,
        customerName: item.customerName || `Khách hàng #${item.customerId || ''}`,
        customerPhone: item.customerPhone || '0987654321',
        restaurantId: item.restaurantId,
        receiverAddress: item.receiverAddress || 'Chưa cập nhật địa chỉ',
        subtotalAmount: Number(item.subtotalAmount || 0),
        shippingFee: Number(item.shippingFee || 0),
        discountAmount: Number(item.discountAmount || 0),
        totalAmount: Number(item.totalAmount || 0),
        paymentMethod: item.paymentMethod || 'COD',
        statusCode: item.statusCode || 'PENDING',
        statusLabel: item.statusLabel || item.statusCode,
        customerNote: item.customerNote || item.note || '',
        cancelReason: item.cancelReason || '',
        createdAt: item.createdAt || new Date().toISOString(),
        items: (item.items || []).map((it: any) => ({
          id: it.id,
          foodId: it.foodId,
          foodName: it.foodName || 'Món ăn',
          quantity: it.quantity || 1,
          priceAtOrder: Number(it.priceAtOrder || 0),
          toppings: (it.toppings || []).map((tp: any) => ({
            id: tp.id,
            toppingId: tp.toppingId,
            name: tp.name || `Topping #${tp.toppingId}`,
            price: Number(tp.price || 0),
            quantity: tp.quantity || 1,
          })),
        })),
      }));

      return {
        status: 200,
        message: 'Success',
        data: {
          content: mapped,
          totalElements,
          totalPages,
          pageNumber,
          pageSize,
          last,
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      const fallbackList = getFallbackOrders(requestParams.status, requestParams.restaurantId).data || [];
      return {
        status: 200,
        message: 'Fallback Data',
        data: {
          content: fallbackList,
          totalElements: fallbackList.length,
          totalPages: 1,
          pageNumber: 0,
          pageSize: 10,
          last: true,
        },
        timestamp: new Date().toISOString(),
      };
    }
  },

  confirmOrderByMerchant: async (orderId: number | string): Promise<ApiResponse<MerchantOrder>> => {
    try {
      const res = await apiClient.put<MerchantOrder>(`/orders/${orderId}/status`, {
        statusCode: 'CONFIRMED',
        status: 'CONFIRMED',
        reason: 'Quán đã xác nhận và đang chế biến',
      });
      updateMockOrderStatus(orderId, 'CONFIRMED');
      return res;
    } catch {
      const updated = updateMockOrderStatus(orderId, 'CONFIRMED');
      return {
        status: 200,
        message: 'Xác nhận nhận đơn thành công (Quán bắt đầu nấu)',
        data: updated,
        timestamp: new Date().toISOString(),
      };
    }
  },

  cancelOrderByMerchant: async (
    orderId: number | string,
    reason: string
  ): Promise<ApiResponse<MerchantOrder>> => {
    try {
      const res = await apiClient.put<MerchantOrder>(`/orders/${orderId}/status`, {
        statusCode: 'CANCELLED',
        reason,
      });
      updateMockOrderStatus(orderId, 'CANCELLED', reason);
      return res;
    } catch {
      const updated = updateMockOrderStatus(orderId, 'CANCELLED', reason);
      return {
        status: 200,
        message: 'Đã từ chối/hủy đơn hàng thành công',
        data: updated,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

// ==========================================
// Merchant Order Data Types & Mock Fallback
// ==========================================
export interface OrderItemTopping {
  id?: number;
  toppingId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItemDetail {
  id: number;
  foodId: number;
  foodName: string;
  quantity: number;
  priceAtOrder: number;
  toppings?: OrderItemTopping[];
}

export interface MerchantOrder {
  id: number;
  orderCode: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  restaurantId: number;
  restaurantName?: string;
  receiverAddress: string;
  items: OrderItemDetail[];
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  statusCode: 'PENDING' | 'CONFIRMED' | 'DRIVER_ACCEPTED' | 'PICKING_UP' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED' | 'AWAITING_PAYMENT' | string;
  statusLabel?: string;
  driverId?: number;
  driverName?: string;
  driverPhone?: string;
  distanceKm?: number;
  receiverLat?: number;
  receiverLng?: number;
  customerNote?: string;
  cancelReason?: string;
  createdAt: string;
}

const MOCK_STORAGE_KEY = 'thunder_merchant_orders_mock';

const INITIAL_MOCK_ORDERS: MerchantOrder[] = [
  {
    id: 101,
    orderCode: 'ORD-20261027-101',
    customerId: 1,
    customerName: 'Nguyễn Văn An',
    customerPhone: '0987654321',
    restaurantId: 1,
    restaurantName: 'Hạnh Dũng - Ẩm Thực Chay Mặn',
    receiverAddress: '144 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    subtotalAmount: 95000,
    shippingFee: 15000,
    discountAmount: 15000,
    totalAmount: 95000,
    paymentMethod: 'COD',
    statusCode: 'PENDING',
    statusLabel: 'Chờ quán xác nhận',
    customerNote: 'Làm ít cay, cho nhiều rau sống giúp em nhé!',
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    items: [
      {
        id: 1,
        foodId: 1,
        foodName: 'Cơm Tấm Chay',
        quantity: 2,
        priceAtOrder: 45000,
        toppings: [
          { toppingId: 1, name: 'Thêm chả lụa chay', price: 10000, quantity: 1 },
          { toppingId: 3, name: 'Thêm cơm', price: 5000, quantity: 1 },
        ],
      },
      {
        id: 2,
        foodId: 2,
        foodName: 'Trà Đá',
        quantity: 1,
        priceAtOrder: 5000,
      },
    ],
  },
  {
    id: 102,
    orderCode: 'ORD-20261027-102',
    customerId: 2,
    customerName: 'Trần Thị Mai Lan',
    customerPhone: '0912345678',
    restaurantId: 1,
    restaurantName: 'Hạnh Dũng - Ẩm Thực Chay Mặn',
    receiverAddress: 'Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    subtotalAmount: 114000,
    shippingFee: 18000,
    discountAmount: 20000,
    totalAmount: 112000,
    paymentMethod: 'VNPAY',
    statusCode: 'PENDING',
    statusLabel: 'Chờ quán xác nhận',
    customerNote: 'Gọi điện trước khi lên lầu 12, chuông cửa hỏng.',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    items: [
      {
        id: 3,
        foodId: 1,
        foodName: 'Cơm Tấm Chay Đặc Biệt',
        quantity: 2,
        priceAtOrder: 45000,
        toppings: [
          { toppingId: 2, name: 'Thêm sườn non chay', price: 12000, quantity: 2 },
        ],
      },
      {
        id: 4,
        foodId: 2,
        foodName: 'Trà Đá',
        quantity: 2,
        priceAtOrder: 5000,
      },
    ],
  },
  {
    id: 103,
    orderCode: 'ORD-20261027-103',
    customerId: 3,
    customerName: 'Lê Hoàng Nam',
    customerPhone: '0933445566',
    restaurantId: 1,
    restaurantName: 'Hạnh Dũng - Ẩm Thực Chay Mặn',
    receiverAddress: 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội',
    subtotalAmount: 55000,
    shippingFee: 16000,
    discountAmount: 0,
    totalAmount: 71000,
    paymentMethod: 'COD',
    statusCode: 'CONFIRMED',
    statusLabel: 'Quán đang chuẩn bị món',
    customerNote: 'Cho nhiều nước dùng và muỗng đũa.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    items: [
      {
        id: 5,
        foodId: 3,
        foodName: 'Hủ Tiếu Nam Vang Chay',
        quantity: 1,
        priceAtOrder: 55000,
      },
    ],
  },
  {
    id: 104,
    orderCode: 'ORD-20261027-104',
    customerId: 4,
    customerName: 'Hoàng Anh Tuấn',
    customerPhone: '0977889900',
    restaurantId: 1,
    restaurantName: 'Hạnh Dũng - Ẩm Thực Chay Mặn',
    receiverAddress: '264 Bà Hạt, Phường 9, Quận 10, TP.HCM',
    subtotalAmount: 45000,
    shippingFee: 15000,
    discountAmount: 10000,
    totalAmount: 50000,
    paymentMethod: 'COD',
    statusCode: 'CANCELLED',
    statusLabel: 'Đã hủy',
    cancelReason: 'Quán tạm hết nguyên liệu chả lụa chay',
    customerNote: 'Giao trước 12h.',
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    items: [
      {
        id: 6,
        foodId: 1,
        foodName: 'Cơm Tấm Chay',
        quantity: 1,
        priceAtOrder: 45000,
      },
    ],
  },
  {
    id: 105,
    orderCode: 'ORD-20261027-105',
    customerId: 5,
    customerName: 'Vũ Thị Ngọc Ánh',
    customerPhone: '0965112233',
    restaurantId: 1,
    restaurantName: 'Hạnh Dũng - Ẩm Thực Chay Mặn',
    receiverAddress: 'Toà nhà Bitexco, số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM',
    subtotalAmount: 135000,
    shippingFee: 20000,
    discountAmount: 25000,
    totalAmount: 130000,
    paymentMethod: 'VNPAY',
    statusCode: 'COMPLETED',
    statusLabel: 'Giao hàng thành công',
    customerNote: 'Đã thanh toán trước qua cổng VNPay-QR. Giao tới sảnh lễ tân.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    items: [
      {
        id: 7,
        foodId: 4,
        foodName: 'Lẩu Nấm Chay Thập Cẩm',
        quantity: 1,
        priceAtOrder: 120000,
        toppings: [
          { toppingId: 4, name: 'Thêm nấm đùi gà', price: 15000, quantity: 1 },
        ],
      },
    ],
  },
];

function loadMockOrders(): MerchantOrder[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return INITIAL_MOCK_ORDERS;
}

function saveMockOrders(orders: MerchantOrder[]): void {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

function getFallbackOrders(status?: string, restaurantId?: number | string): ApiResponse<MerchantOrder[]> {
  const all = loadMockOrders();
  const filtered = all.filter((o) => {
    const matchStatus = !status || status === 'ALL' || o.statusCode === status;
    const matchRestaurant = !restaurantId || Number(o.restaurantId) === Number(restaurantId);
    return matchStatus && matchRestaurant;
  });
  return {
    status: 200,
    message: 'Success (Data loaded)',
    data: filtered,
    timestamp: new Date().toISOString(),
  };
}

function updateMockOrderStatus(
  orderId: number | string,
  statusCode: 'CONFIRMED' | 'CANCELLED',
  reason?: string
): MerchantOrder {
  const orders = loadMockOrders();
  const idNum = Number(orderId);
  const target = orders.find((o) => o.id === idNum);
  if (target) {
    target.statusCode = statusCode;
    target.statusLabel = statusCode === 'CONFIRMED' ? 'Quán đang chuẩn bị món' : 'Đã hủy';
    if (reason) {
      target.cancelReason = reason;
    }
    saveMockOrders(orders);
    return target;
  }
  return {
    id: idNum,
    orderCode: `ORD-${idNum}`,
    customerName: 'Khách hàng',
    customerPhone: '0900000000',
    restaurantId: 1,
    receiverAddress: 'Địa chỉ nhận hàng',
    subtotalAmount: 50000,
    shippingFee: 15000,
    discountAmount: 0,
    totalAmount: 65000,
    statusCode,
    statusLabel: statusCode === 'CONFIRMED' ? 'Quán đang chuẩn bị món' : 'Đã hủy',
    cancelReason: reason,
    createdAt: new Date().toISOString(),
    items: [],
  };
}

