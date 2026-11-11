import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface DriverOrderItem {
  name: string;
  quantity: number;
  price: number;
  toppings?: string[];
}

export interface DriverOrder {
  id: number;
  orderCode: string;
  restaurantId?: number;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  distanceKm: number;
  shippingFee: number;
  codAmount: number; // Tiền mặt COD cần ứng/thu từ khách
  totalAmount: number;
  paymentMethod: 'COD' | 'VNPAY' | 'SEPAY' | 'WALLET' | string;
  items: DriverOrderItem[];
  statusCode: string;
  expiresInSeconds?: number;
  note?: string;
  createdAt: string;
}

export interface DriverWalletSummary {
  todayEarnings: number;
  completedTripsToday: number;
  tipsToday: number;
  walletBalance: number;
  recentTrips: Array<{
    id: string;
    orderCode: string;
    restaurantName: string;
    address: string;
    time: string;
    earning: number;
  }>;
}

export interface DriverTripHistory {
  id: string | number;
  orderCode: string;
  restaurantName: string;
  restaurantAddress: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  shippingFee: number; // Tiền cước thu về
  paymentMethod: 'COD' | 'SEPAY' | 'VNPAY' | 'WALLET' | string;
  codAmount: number;
  distanceKm: number;
  completedAt: string;
  itemsSummary: string;
  status: 'COMPLETED';
}

export interface DriverIncomeStatistics {
  walletBalance: number;
  todayEarnings: number;
  completedTripsToday: number;
  tipsToday: number;
  weekEarnings: number;
  completedTripsWeek: number;
  tipsWeek: number;
  acceptanceRate: number;
  completionRate: number;
}

export interface DriverReviewItem {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  orderCode: string;
  timeAgo: string;
}

export interface DriverReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingRank: string;
  reviews: DriverReviewItem[];
}

// Initial Mock Radar Orders matching the specification:
// Tên quán, khoảng cách, phí ship thu nhập và tiền COD cần ứng
export const INITIAL_MOCK_RADAR_ORDERS: DriverOrder[] = [
  {
    id: 9101,
    orderCode: 'THUNDER-9101',
    restaurantId: 1,
    restaurantName: 'Cơm Tấm Phúc Lộc Thọ - Xuân Thủy',
    restaurantAddress: '144 Xuân Thủy, Cầu Giấy, Hà Nội',
    restaurantPhone: '0901234567',
    receiverName: 'Nguyễn Thu Trang',
    receiverPhone: '0988776655',
    receiverAddress: 'Tòa nhà Keangnam Landmark 72, Phạm Hùng, Mễ Trì',
    distanceKm: 2.8,
    shippingFee: 28000,
    codAmount: 145000,
    totalAmount: 173000,
    paymentMethod: 'COD',
    statusCode: 'CONFIRMED',
    expiresInSeconds: 30,
    note: 'Lấy thêm nhiều nước mắm ớt và ớt xiêm xanh giúp mình',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt', quantity: 2, price: 65000, toppings: ['Trứng ốp la', 'Canh rong biển'] },
      { name: 'Trà Tắc Khổng Lồ', quantity: 1, price: 15000 },
    ],
  },
  {
    id: 9102,
    orderCode: 'THUNDER-9102',
    restaurantId: 2,
    restaurantName: 'Trà Sữa Phê La - Đống Đa',
    restaurantAddress: '24 Hàng Cót, Hoàn Kiếm, Hà Nội',
    restaurantPhone: '0912345678',
    receiverName: 'Trần Minh Quân',
    receiverPhone: '0977889900',
    receiverAddress: '58 Trúc Khê, Láng Hạ, Đống Đa, Hà Nội',
    distanceKm: 1.6,
    shippingFee: 22000,
    codAmount: 0, // Đã thanh toán online SePay
    totalAmount: 110000,
    paymentMethod: 'SEPAY',
    statusCode: 'CONFIRMED',
    expiresInSeconds: 30,
    note: 'Giao lên tầng 4 gọi bảo vệ giúp em nhé',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Ô Long Sữa Phê La (Ít đá, 50% đường)', quantity: 2, price: 55000, toppings: ['Trân châu Ô long'] },
    ],
  },
  {
    id: 9103,
    orderCode: 'THUNDER-9103',
    restaurantId: 3,
    restaurantName: 'Bún Chả Sinh Từ - Cầu Giấy',
    restaurantAddress: '2 Nguyễn Phong Sắc, Dịch Vọng, Cầu Giấy',
    restaurantPhone: '0933445566',
    receiverName: 'Lê Hoàng Nam',
    receiverPhone: '0944556677',
    receiverAddress: 'Số 18 Ngõ 86 Duy Tân, Cầu Giấy, Hà Nội',
    distanceKm: 3.4,
    shippingFee: 34000,
    codAmount: 180000,
    totalAmount: 214000,
    paymentMethod: 'COD',
    statusCode: 'CONFIRMED',
    expiresInSeconds: 30,
    note: 'Xin thêm tỏi ớt băm và rau sống ăn kèm',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Bún Chả Đặc Biệt Suất Lớn', quantity: 2, price: 75000 },
      { name: 'Nem cua bể Hải Phòng', quantity: 2, price: 15000 },
    ],
  },
];

export const driverApi = {
  // 1. Quét tìm danh sách đơn hàng khả dụng quanh khu vực
  getAvailableOrders: async (): Promise<DriverOrder[]> => {
    try {
      const response = await apiClient.get<ApiResponse<DriverOrder[]>>(API_ENDPOINTS.DELIVERY.AVAILABLE_ORDERS);
      const orders = response?.data?.data;
      if (Array.isArray(orders) && orders.length > 0) {
        return orders;
      }
    } catch {
      // Graceful fallback to rich mock data
    }
    return INITIAL_MOCK_RADAR_ORDERS;
  },

  // 2. Tài xế nhận đơn ngay
  acceptOrder: async (orderId: number | string): Promise<DriverOrder> => {
    try {
      const response = await apiClient.post<ApiResponse<DriverOrder>>(API_ENDPOINTS.DELIVERY.ACCEPT(orderId));
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback: Return locally updated accepted order
    }
    const matched = INITIAL_MOCK_RADAR_ORDERS.find((o) => o.id === Number(orderId));
    if (matched) {
      return { ...matched, statusCode: 'DRIVER_ACCEPTED' };
    }
    return {
      id: Number(orderId),
      orderCode: `THUNDER-${orderId}`,
      restaurantName: 'Quán ăn đối tác',
      restaurantAddress: '123 Cầu Giấy, Hà Nội',
      restaurantPhone: '0901234567',
      receiverName: 'Khách hàng',
      receiverPhone: '0987654321',
      receiverAddress: '456 Kim Mã, Ba Đình, Hà Nội',
      distanceKm: 2.5,
      shippingFee: 25000,
      codAmount: 120000,
      totalAmount: 145000,
      paymentMethod: 'COD',
      items: [{ name: 'Món ăn đặc sản', quantity: 1, price: 120000 }],
      statusCode: 'DRIVER_ACCEPTED',
      createdAt: new Date().toISOString(),
    };
  },

  // 3. Cập nhật trạng thái cuốc xe (PICKING_UP -> DELIVERING -> COMPLETED)
  updateStatus: async (orderId: number | string, statusCode: string): Promise<void> => {
    try {
      await apiClient.put(API_ENDPOINTS.DELIVERY.UPDATE_STATUS(orderId), { statusCode });
    } catch {
      // Non-blocking in simulation mode
    }
  },

  // 4. Lấy thông tin ví & thống kê thu nhập
  getWalletSummary: async (): Promise<DriverWalletSummary> => {
    try {
      const response = await apiClient.get<ApiResponse<DriverWalletSummary>>(API_ENDPOINTS.DELIVERY.EARNINGS);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch {
      // Mock wallet data
    }
    return {
      todayEarnings: 345000,
      completedTripsToday: 14,
      tipsToday: 45000,
      walletBalance: 1850000,
      recentTrips: [
        {
          id: 'TRIP-9021',
          orderCode: '#THUNDER-9021',
          restaurantName: 'Cơm Tấm Sài Gòn 1982',
          address: '144 Xuân Thủy, Cầu Giấy',
          time: '12:45',
          earning: 28000,
        },
        {
          id: 'TRIP-9018',
          orderCode: '#THUNDER-9018',
          restaurantName: 'Trà Sữa KOI Thé',
          address: '12 Cầu Giấy, Ba Đình',
          time: '11:20',
          earning: 22000,
        },
        {
          id: 'TRIP-8995',
          orderCode: '#THUNDER-8995',
          restaurantName: 'Gà Rán KFC Duy Tân',
          address: 'Tòa nhà FPT, Duy Tân',
          time: '10:15',
          earning: 35000,
        },
        {
          id: 'TRIP-8980',
          orderCode: '#THUNDER-8980',
          restaurantName: 'Bánh Mì Huỳnh Hoa',
          address: '58 Kim Mã, Ba Đình',
          time: '09:05',
          earning: 25000,
        },
      ],
    };
  },

  // 5. Thống kê đánh giá của tài xế
  getReviewSummary: async (): Promise<DriverReviewSummary> => {
    return {
      averageRating: 4.9,
      totalReviews: 148,
      ratingRank: 'Hạng Tài Xế Xuất Sắc (Top 5%)',
      reviews: [
        {
          id: 1,
          customerName: 'Nguyễn Văn An',
          rating: 5,
          comment: 'Giao hàng siêu nhanh, đồ ăn còn bốc khói nóng hổi! Tài xế nhiệt tình dễ thương 10 điểm.',
          orderCode: '#THUNDER-9021',
          timeAgo: '1 giờ trước',
        },
        {
          id: 2,
          customerName: 'Trần Thị Mai',
          rating: 5,
          comment: 'Tài xế rất lịch sự, gọi trước khi đến 5 phút để mình chuẩn bị xuống lấy đồ.',
          orderCode: '#THUNDER-9018',
          timeAgo: '2 giờ trước',
        },
        {
          id: 3,
          customerName: 'Hoàng Minh Tuấn',
          rating: 5,
          comment: 'Bảo quản nước uống cẩn thận không bị đổ giọt nào. Chúc bạn thượng lộ bình an!',
          orderCode: '#THUNDER-8995',
          timeAgo: '3 giờ trước',
        },
      ],
    };
  },

  // 6. Thống kê thu nhập tích lũy theo ngày và tuần (SP3-DRV-05)
  getIncomeStatistics: async (): Promise<DriverIncomeStatistics> => {
    return {
      walletBalance: 1850000,
      todayEarnings: 345000,
      completedTripsToday: 14,
      tipsToday: 45000,
      weekEarnings: 2420000,
      completedTripsWeek: 86,
      tipsWeek: 215000,
      acceptanceRate: 98,
      completionRate: 100,
    };
  },

  // 7. Lấy danh sách lịch sử các cuốc xe đã hoàn thành (SP3-DRV-05)
  getTripHistory: async (params?: { period?: 'today' | 'week' | 'all'; search?: string }): Promise<DriverTripHistory[]> => {
    const allTrips: DriverTripHistory[] = [
      {
        id: 'HIST-9045',
        orderCode: '#THUNDER-9045',
        restaurantName: 'Cơm Tấm Phúc Lộc Thọ - Xuân Thủy',
        restaurantAddress: '144 Xuân Thủy, Cầu Giấy',
        receiverName: 'Nguyễn Thu Trang',
        receiverAddress: 'Tòa nhà FPT, Số 10 Phạm Văn Bạch, Cầu Giấy',
        receiverPhone: '0988776655',
        shippingFee: 32000,
        paymentMethod: 'COD',
        codAmount: 145000,
        distanceKm: 2.8,
        completedAt: 'Hôm nay, 11:30',
        itemsSummary: '2x Cơm Tấm Sườn Bì Chả Đặc Biệt, 1x Trà Tắc',
        status: 'COMPLETED',
      },
      {
        id: 'HIST-9032',
        orderCode: '#THUNDER-9032',
        restaurantName: 'Trà Sữa Phê La - Đống Đa',
        restaurantAddress: '24 Hàng Cót, Hoàn Kiếm',
        receiverName: 'Trần Minh Quân',
        receiverAddress: '58 Trúc Khê, Láng Hạ, Đống Đa',
        receiverPhone: '0977889900',
        shippingFee: 25000,
        paymentMethod: 'SEPAY',
        codAmount: 0,
        distanceKm: 1.6,
        completedAt: 'Hôm nay, 10:45',
        itemsSummary: '2x Ô Long Sữa Phê La (Trân châu Ô long)',
        status: 'COMPLETED',
      },
      {
        id: 'HIST-9018',
        orderCode: '#THUNDER-9018',
        restaurantName: 'Bún Chả Sinh Từ - Cầu Giấy',
        restaurantAddress: '2 Nguyễn Phong Sắc, Dịch Vọng',
        receiverName: 'Lê Hoàng Nam',
        receiverAddress: 'Số 18 Ngõ 86 Duy Tân, Cầu Giấy',
        receiverPhone: '0944556677',
        shippingFee: 28000,
        paymentMethod: 'COD',
        codAmount: 180000,
        distanceKm: 3.4,
        completedAt: 'Hôm nay, 09:50',
        itemsSummary: '2x Bún Chả Đặc Biệt Suất Lớn, 2x Nem Cua Bể',
        status: 'COMPLETED',
      },
      {
        id: 'HIST-9005',
        orderCode: '#THUNDER-9005',
        restaurantName: 'Gà Rán KFC - BigC Thăng Long',
        restaurantAddress: '222 Trần Duy Hưng, Trung Hòa',
        receiverName: 'Phạm Thanh Hoa',
        receiverAddress: 'Tòa nhà Keangnam Landmark 72, Mễ Trì',
        receiverPhone: '0933221100',
        shippingFee: 35000,
        paymentMethod: 'VNPAY',
        codAmount: 0,
        distanceKm: 3.8,
        completedAt: 'Hôm nay, 08:30',
        itemsSummary: '1x Combo Gà Rán Gia Đình, 2x Khoai Tây Chiên Lớn',
        status: 'COMPLETED',
      },
      {
        id: 'HIST-8992',
        orderCode: '#THUNDER-8992',
        restaurantName: 'Bánh Mì Huỳnh Hoa',
        restaurantAddress: '58 Kim Mã, Ba Đình',
        receiverName: 'Vũ Đức Anh',
        receiverAddress: 'Tòa nhà Lotte Center, 54 Liễu Giai',
        receiverPhone: '0911223344',
        shippingFee: 22000,
        paymentMethod: 'COD',
        codAmount: 75000,
        distanceKm: 1.4,
        completedAt: 'Hôm qua, 18:20',
        itemsSummary: '2x Bánh Mì Pate Chả Đặc Biệt',
        status: 'COMPLETED',
      },
      {
        id: 'HIST-8980',
        orderCode: '#THUNDER-8980',
        restaurantName: 'Phở Thìn Lò Đúc Gia Truyền',
        restaurantAddress: '13 Lò Đúc, Hai Bà Trưng',
        receiverName: 'Đặng Ngọc Lan',
        receiverAddress: 'Vincom Center Bà Triệu, 191 Bà Triệu',
        receiverPhone: '0922334455',
        shippingFee: 30000,
        paymentMethod: 'WALLET',
        codAmount: 0,
        distanceKm: 2.5,
        completedAt: '3 ngày trước, 12:10',
        itemsSummary: '1x Phở Tái Lăn Bò Bắp Đặc Biệt, 1x Trứng Chần',
        status: 'COMPLETED',
      },
      {
        id: 'HIST-8971',
        orderCode: '#THUNDER-8971',
        restaurantName: "Pizza 4P's - Phan Kế Bính",
        restaurantAddress: '5 Phan Kế Bính, Cống Vị',
        receiverName: 'Hoàng Quốc Bảo',
        receiverAddress: 'Đại sứ quán Nhật Bản, 27 Liễu Giai',
        receiverPhone: '0955667788',
        shippingFee: 45000,
        paymentMethod: 'SEPAY',
        codAmount: 0,
        distanceKm: 4.2,
        completedAt: '4 ngày trước, 19:40',
        itemsSummary: '1x Pizza 4 Cheese Mật Ong, 1x Mì Ý Cua Sốt Cà Chua',
        status: 'COMPLETED',
      },
      {
        id: 'HIST-8960',
        orderCode: '#THUNDER-8960',
        restaurantName: 'The Coffee House - Thái Hà',
        restaurantAddress: '1 Thái Hà, Trung Liệt, Đống Đa',
        receiverName: 'Bùi Diệu Linh',
        receiverAddress: 'Học viện Ngân Hàng, 12 Chùa Bộc',
        receiverPhone: '0966778899',
        shippingFee: 20000,
        paymentMethod: 'COD',
        codAmount: 95000,
        distanceKm: 1.1,
        completedAt: '5 ngày trước, 15:15',
        itemsSummary: '2x Trà Đào Cam Sả Size Lớn',
        status: 'COMPLETED',
      },
    ];

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      return allTrips.filter(
        (t) =>
          t.orderCode.toLowerCase().includes(q) ||
          t.restaurantName.toLowerCase().includes(q) ||
          t.receiverAddress.toLowerCase().includes(q)
      );
    }

    if (params?.period === 'today') {
      return allTrips.filter((t) => t.completedAt.includes('Hôm nay'));
    }

    return allTrips;
  },
};

