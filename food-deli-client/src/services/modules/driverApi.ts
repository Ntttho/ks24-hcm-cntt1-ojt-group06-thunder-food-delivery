import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse, PaginatedData } from '@/types';
import { restaurantApi } from './restaurantApi';
import { storage } from '@/utils/storage';

export interface DriverOrderItem {
  name: string;
  quantity: number;
  price: number;
  toppings?: string[];
}

export interface DriverOrder {
  id: number;
  orderCode: string;
  driverId?: number | null;
  restaurantId?: number;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  distanceKm: number;
  shippingFee: number;
  codAmount: number; // Tiền mặt COD cần thu từ khách (0 nếu đã thanh toán online)
  totalAmount: number;
  paymentMethod: 'COD' | 'VNPAY' | 'SEPAY' | 'WALLET' | string;
  items: DriverOrderItem[];
  statusCode: string;
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

export type DriverHistoryStatus =
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DRIVER_REJECTED'
  | 'DRIVER_CANCELLED'
  | 'TIMEOUT'
  | 'FAILED'
  | string;

export interface DriverTripHistory {
  id: string | number;
  orderCode: string;
  restaurantId?: number;
  restaurantName: string;
  restaurantAddress: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  shippingFee: number; // Tiền cước gốc của đơn hàng
  earnedFee: number; // Tiền cước thực nhận (chỉ tính nếu isSuccess = true)
  paymentMethod: 'COD' | 'SEPAY' | 'VNPAY' | 'WALLET' | string;
  codAmount: number;
  distanceKm: number;
  completedAt: string;
  completedAtIso: string;
  itemsSummary: string;
  status: DriverHistoryStatus;
  statusLabel: string;
  isSuccess: boolean;
  cancelReason?: string;
}

export interface DriverIncomeStatistics {
  walletBalance: number;
  todayEarnings: number;
  completedTripsToday: number;
  failedTripsToday: number;
  tipsToday: number;
  weekEarnings: number;
  completedTripsWeek: number;
  failedTripsWeek: number;
  tipsWeek: number;
  totalTripsAll: number;
  completedTripsAll: number;
  failedTripsAll: number;
  acceptanceRate: number;
  completionRate: number;
}

export interface DriverHistoryDashboard {
  stats: DriverIncomeStatistics;
  trips: DriverTripHistory[];
}

export interface DriverHistoryQueryParams {
  driverId?: number | string;
  period?: 'today' | 'week' | 'all';
  statusFilter?: 'ALL' | 'SUCCESS' | 'FAILED';
  search?: string;
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
  unavailableReason?: string;
}

// =========================================================================
// Internal Backend DTOs & Mappers (order-service, restaurant-service, review-service)
// =========================================================================

interface BackendOrderStatusLogDto {
  id?: number;
  previousStatus?: string;
  newStatus?: string;
  changedBy?: number;
  reason?: string;
  createdAt?: string;
}

interface BackendOrderItemToppingDto {
  id?: number;
  toppingId?: number;
  name?: string;
  quantity?: number;
  price?: number;
}

interface BackendOrderItemDto {
  id?: number;
  foodId?: number;
  foodName?: string;
  quantity?: number;
  priceAtOrder?: number;
  toppings?: BackendOrderItemToppingDto[];
}

interface BackendOrderDto {
  id: number;
  orderCode?: string;
  customerId?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  restaurantId: number;
  driverId?: number | null;
  receiverAddress?: string | null;
  distanceKm?: number | null;
  shippingFee?: number | null;
  totalAmount?: number | null;
  paymentMethod?: string | null;
  statusCode?: string | null;
  statusLabel?: string | null;
  cancelReason?: string | null;
  note?: string | null;
  createdAt: string;
  items?: BackendOrderItemDto[];
  statusLogs?: BackendOrderStatusLogDto[];
}

interface BackendReviewDto {
  id: number;
  orderId?: number;
  customerName?: string | null;
  rating?: number;
  comment?: string | null;
  createdAt?: string | null;
}

interface BackendReviewSummaryDto {
  totalReviews?: number;
  averageRating?: number;
  recentReviews?: BackendReviewDto[];
}

interface RestaurantDirectoryInfo {
  name: string;
  address: string;
}

const ACTIVE_DELIVERY_STATUSES = new Set(['DRIVER_ACCEPTED', 'PICKING_UP', 'DELIVERING']);
const SUCCESS_HISTORY_STATUSES = new Set(['COMPLETED']);
const FAIL_HISTORY_STATUSES = new Set([
  'CANCELLED',
  'DRIVER_REJECTED',
  'DRIVER_CANCELLED',
  'TIMEOUT',
  'FAILED',
]);

// Cache danh mục quán ngắn hạn (30s) để tránh gọi lặp lại khi radar poll liên tục
let restaurantDirectoryCache: {
  map: Map<number, RestaurantDirectoryInfo>;
  expiresAt: number;
} | null = null;

const isHistoryOrderStatus = (statusCode?: string | null): boolean => {
  const code = (statusCode || '').trim().toUpperCase();
  return SUCCESS_HISTORY_STATUSES.has(code) || FAIL_HISTORY_STATUSES.has(code);
};

const resolveHistoryStatusLabel = (statusCode: string, backendLabel?: string | null): string => {
  switch (statusCode.toUpperCase()) {
    case 'COMPLETED':
      return 'Giao thành công';
    case 'CANCELLED':
      return 'Đơn bị hủy';
    case 'DRIVER_REJECTED':
    case 'DRIVER_CANCELLED':
      return 'Tài xế trả đơn';
    case 'TIMEOUT':
      return 'Quá thời gian';
    case 'FAILED':
      return 'Giao thất bại';
    default:
      return backendLabel || statusCode;
  }
};

const resolveOrderFinalTimestamp = (order: BackendOrderDto): { date: Date; iso: string } => {
  const targetCode = (order.statusCode || '').trim().toUpperCase();
  const logs = order.statusLogs || [];
  let matchedLog: BackendOrderStatusLogDto | undefined;

  for (let i = logs.length - 1; i >= 0; i -= 1) {
    if ((logs[i]?.newStatus || '').trim().toUpperCase() === targetCode && logs[i]?.createdAt) {
      matchedLog = logs[i];
      break;
    }
  }

  const fallbackIso =
    matchedLog?.createdAt ||
    (logs.length > 0 ? logs[logs.length - 1]?.createdAt : undefined) ||
    order.createdAt ||
    new Date().toISOString();

  const parsed = new Date(fallbackIso);
  const validDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return { date: validDate, iso: validDate.toISOString() };
};

const resolveCancelReason = (order: BackendOrderDto, isSuccess: boolean): string | undefined => {
  if (isSuccess) return undefined;
  if (order.cancelReason && order.cancelReason.trim()) {
    return order.cancelReason.trim();
  }
  const targetCode = (order.statusCode || '').trim().toUpperCase();
  const logs = order.statusLogs || [];
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    if ((logs[i]?.newStatus || '').trim().toUpperCase() === targetCode && logs[i]?.reason?.trim()) {
      return logs[i].reason!.trim();
    }
  }
  return undefined;
};

const resolveDriverId = (explicitDriverId?: number | string): number | string => {
  if (explicitDriverId !== undefined && explicitDriverId !== null && String(explicitDriverId).trim() !== '') {
    return explicitDriverId;
  }
  const currentUserId = storage.getUser()?.id;
  if (currentUserId !== undefined && currentUserId !== null && String(currentUserId).trim() !== '') {
    return currentUserId;
  }
  throw new Error('Không xác định được ID tài xế đang đăng nhập. Vui lòng đăng nhập lại.');
};

const extractOrderList = (
  res: ApiResponse<PaginatedData<BackendOrderDto> | BackendOrderDto[]> | undefined
): BackendOrderDto[] => {
  const payload = res?.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.content)) {
    return payload.content;
  }
  return [];
};

const fetchRestaurantDirectoryMap = async (
  restaurantIds: number[]
): Promise<Map<number, RestaurantDirectoryInfo>> => {
  const now = Date.now();
  const map = new Map<number, RestaurantDirectoryInfo>(
    restaurantDirectoryCache && restaurantDirectoryCache.expiresAt > now
      ? restaurantDirectoryCache.map
      : []
  );

  if (map.size === 0) {
    try {
      const res = await restaurantApi.getAllRestaurantsNoPaging();
      const shops = Array.isArray(res?.data) ? res.data : [];
      shops.forEach((shop) => {
        if (shop.id) {
          map.set(Number(shop.id), {
            name: shop.name,
            address: shop.address || 'Chưa cập nhật địa chỉ quán',
          });
        }
      });
      if (map.size > 0) {
        restaurantDirectoryCache = {
          map: new Map(map),
          expiresAt: now + 30_000,
        };
      }
    } catch {
      // Sẽ gọi chi tiết từng ID còn thiếu bên dưới nếu /restaurants/all gặp sự cố
    }
  }

  const missingIds = Array.from(new Set(restaurantIds)).filter((id) => id > 0 && !map.has(id));
  if (missingIds.length > 0) {
    await Promise.all(
      missingIds.map(async (id) => {
        try {
          const detailRes = await restaurantApi.getById(id);
          if (detailRes?.data?.name) {
            const info: RestaurantDirectoryInfo = {
              name: detailRes.data.name,
              address: detailRes.data.address || 'Chưa cập nhật địa chỉ quán',
            };
            map.set(id, info);
            restaurantDirectoryCache?.map.set(id, info);
          }
        } catch {
          // Bỏ qua nếu quán không còn tồn tại
        }
      })
    );
  }

  return map;
};

const fetchAllDriverOrders = async (driverId: number | string): Promise<BackendOrderDto[]> => {
  const pageSize = 100;
  const firstRes = await apiClient.get<PaginatedData<BackendOrderDto>>(API_ENDPOINTS.ORDERS.LIST, {
    params: { driverId, page: 0, size: pageSize },
  });

  const firstPage = firstRes?.data;
  const firstList = extractOrderList(firstRes);

  const totalPages = Math.min(firstPage?.totalPages ?? 1, 5);
  if (totalPages <= 1) {
    return firstList;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, idx) =>
      apiClient.get<PaginatedData<BackendOrderDto>>(API_ENDPOINTS.ORDERS.LIST, {
        params: { driverId, page: idx + 1, size: pageSize },
      })
    )
  );

  const rest = remainingPages.flatMap((res) => extractOrderList(res));
  return [...firstList, ...rest];
};

const mapOrderToDriverOrder = (
  order: BackendOrderDto,
  shopMap: Map<number, RestaurantDirectoryInfo>
): DriverOrder => {
  const shop = shopMap.get(Number(order.restaurantId));
  const rawMethod = (order.paymentMethod || '').trim().toUpperCase();
  const paymentMethod = rawMethod || 'UNKNOWN';
  const shippingFee = Number(order.shippingFee || 0);
  const totalAmount = Number(order.totalAmount || 0);
  const codAmount = paymentMethod === 'COD' ? totalAmount : 0;

  return {
    id: order.id,
    orderCode: order.orderCode || `ORD-${order.id}`,
    driverId: order.driverId ?? null,
    restaurantId: order.restaurantId,
    restaurantName: shop?.name || `Quán ăn #${order.restaurantId}`,
    restaurantAddress: shop?.address || 'Chưa cập nhật địa chỉ quán',
    restaurantPhone: '',
    receiverName:
      order.customerName?.trim() || (order.customerId ? `Khách hàng #${order.customerId}` : 'Khách hàng'),
    receiverPhone: order.customerPhone?.trim() || '',
    receiverAddress: order.receiverAddress || 'Chưa cập nhật địa chỉ giao hàng',
    distanceKm: Number(order.distanceKm || 0),
    shippingFee,
    codAmount,
    totalAmount,
    paymentMethod,
    statusCode: (order.statusCode || 'CONFIRMED').trim().toUpperCase(),
    note: order.note?.trim() || undefined,
    createdAt: order.createdAt || new Date().toISOString(),
    items: (order.items || []).map((item) => ({
      name: item.foodName || 'Món ăn',
      quantity: Number(item.quantity || 1),
      price: Number(item.priceAtOrder || 0),
      toppings:
        item.toppings && item.toppings.length > 0
          ? item.toppings.map((tp) => tp.name || `Topping #${tp.toppingId ?? ''}`).filter(Boolean)
          : undefined,
    })),
  };
};

const mapOrderToTripHistory = (
  order: BackendOrderDto,
  shopMap: Map<number, RestaurantDirectoryInfo>
): DriverTripHistory => {
  const statusCode = (order.statusCode || 'COMPLETED').trim().toUpperCase();
  const isSuccess = SUCCESS_HISTORY_STATUSES.has(statusCode);
  const { date, iso } = resolveOrderFinalTimestamp(order);
  const shop = shopMap.get(Number(order.restaurantId));
  const rawCode = order.orderCode || `ORD-${order.id}`;
  const orderCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;
  const rawMethod = (order.paymentMethod || '').trim().toUpperCase();
  const paymentMethod = rawMethod || 'UNKNOWN';
  const shippingFee = Number(order.shippingFee || 0);
  const totalAmount = Number(order.totalAmount || 0);

  const itemsSummary =
    order.items && order.items.length > 0
      ? order.items.map((it) => `${it.quantity || 1}x ${it.foodName || 'Món ăn'}`).join(', ')
      : 'Không có chi tiết món';

  return {
    id: order.id,
    orderCode,
    restaurantId: order.restaurantId,
    restaurantName: shop?.name || `Quán ăn #${order.restaurantId}`,
    restaurantAddress: shop?.address || 'Chưa cập nhật địa chỉ quán',
    receiverName:
      order.customerName?.trim() || (order.customerId ? `Khách hàng #${order.customerId}` : 'Khách hàng'),
    receiverAddress: order.receiverAddress || 'Chưa cập nhật địa chỉ giao hàng',
    receiverPhone: order.customerPhone?.trim() || 'Chưa cập nhật SĐT',
    shippingFee,
    earnedFee: isSuccess ? shippingFee : 0,
    paymentMethod,
    codAmount: isSuccess && paymentMethod === 'COD' ? totalAmount : 0,
    distanceKm: Number(order.distanceKm || 0),
    completedAt: date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    completedAtIso: iso,
    itemsSummary,
    status: statusCode,
    statusLabel: resolveHistoryStatusLabel(statusCode, order.statusLabel),
    isSuccess,
    cancelReason: resolveCancelReason(order, isSuccess),
  };
};

const formatRelativeTimeVi = (isoDate?: string | null): string => {
  if (!isoDate) return 'Gần đây';
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return 'Gần đây';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - time) / 60_000));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffHoursOrDays(diffMinutes, 60));
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
};

const diffHoursOrDays = (value: number, divisor: number): number => value / divisor;

export const computeDriverStatistics = (trips: DriverTripHistory[]): DriverIncomeStatistics => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeekDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startOfWeekDate.setDate(startOfWeekDate.getDate() - 6);
  const startOfWeek = startOfWeekDate.getTime();

  let walletBalance = 0;
  let todayEarnings = 0;
  let completedTripsToday = 0;
  let failedTripsToday = 0;
  let weekEarnings = 0;
  let completedTripsWeek = 0;
  let failedTripsWeek = 0;
  let completedTripsAll = 0;
  let failedTripsAll = 0;

  trips.forEach((trip) => {
    const tripTime = new Date(trip.completedAtIso).getTime();

    if (trip.isSuccess) {
      walletBalance += trip.earnedFee;
      completedTripsAll += 1;

      if (tripTime >= startOfToday) {
        todayEarnings += trip.earnedFee;
        completedTripsToday += 1;
      }
      if (tripTime >= startOfWeek) {
        weekEarnings += trip.earnedFee;
        completedTripsWeek += 1;
      }
    } else {
      failedTripsAll += 1;
      if (tripTime >= startOfToday) {
        failedTripsToday += 1;
      }
      if (tripTime >= startOfWeek) {
        failedTripsWeek += 1;
      }
    }
  });

  const totalTripsAll = completedTripsAll + failedTripsAll;
  const completionRate =
    totalTripsAll > 0 ? Math.round((completedTripsAll / totalTripsAll) * 1000) / 10 : 100;

  return {
    walletBalance,
    todayEarnings,
    completedTripsToday,
    failedTripsToday,
    tipsToday: 0,
    weekEarnings,
    completedTripsWeek,
    failedTripsWeek,
    tipsWeek: 0,
    totalTripsAll,
    completedTripsAll,
    failedTripsAll,
    acceptanceRate: 100,
    completionRate,
  };
};

export const filterDriverTripHistory = (
  trips: DriverTripHistory[],
  params?: Pick<DriverHistoryQueryParams, 'period' | 'statusFilter' | 'search'>
): DriverTripHistory[] => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeekDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startOfWeekDate.setDate(startOfWeekDate.getDate() - 6);
  const startOfWeek = startOfWeekDate.getTime();

  return trips.filter((trip) => {
    const tripTime = new Date(trip.completedAtIso).getTime();

    if (params?.period === 'today' && tripTime < startOfToday) {
      return false;
    }
    if (params?.period === 'week' && tripTime < startOfWeek) {
      return false;
    }

    if (params?.statusFilter === 'SUCCESS' && !trip.isSuccess) {
      return false;
    }
    if (params?.statusFilter === 'FAILED' && trip.isSuccess) {
      return false;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      const matched =
        trip.orderCode.toLowerCase().includes(q) ||
        trip.restaurantName.toLowerCase().includes(q) ||
        trip.restaurantAddress.toLowerCase().includes(q) ||
        trip.receiverAddress.toLowerCase().includes(q) ||
        trip.receiverName.toLowerCase().includes(q) ||
        (trip.cancelReason || '').toLowerCase().includes(q);
      if (!matched) {
        return false;
      }
    }

    return true;
  });
};

export const driverApi = {
  // 1. Dò danh sách đơn đã xác nhận (CONFIRMED) chưa có người giao hàng (driverId = null)
  getAvailableOrders: async (): Promise<DriverOrder[]> => {
    const res = await apiClient.get<PaginatedData<BackendOrderDto>>(API_ENDPOINTS.ORDERS.LIST, {
      params: { status: 'CONFIRMED', page: 0, size: 50 },
    });

    const availableRaw = extractOrderList(res).filter(
      (order) =>
        (order.statusCode || '').trim().toUpperCase() === 'CONFIRMED' &&
        (order.driverId === null || order.driverId === undefined)
    );

    if (availableRaw.length === 0) {
      return [];
    }

    const shopMap = await fetchRestaurantDirectoryMap(availableRaw.map((o) => o.restaurantId));
    return availableRaw.map((o) => mapOrderToDriverOrder(o, shopMap));
  },

  // 1b. Khôi phục đơn hàng tài xế đang giao (DRIVER_ACCEPTED | PICKING_UP | DELIVERING) khi tải lại trang
  getActiveOrder: async (explicitDriverId?: number | string): Promise<DriverOrder | null> => {
    const driverId = resolveDriverId(explicitDriverId);
    const allOrders = await fetchAllDriverOrders(driverId);
    const active = allOrders.find((order) =>
      ACTIVE_DELIVERY_STATUSES.has((order.statusCode || '').trim().toUpperCase())
    );
    if (!active) {
      return null;
    }
    const shopMap = await fetchRestaurantDirectoryMap([active.restaurantId]);
    return mapOrderToDriverOrder(active, shopMap);
  },

  // 2. Tài xế nhận đơn ngay (CONFIRMED -> DRIVER_ACCEPTED qua order-service Pessimistic Lock)
  acceptOrder: async (orderId: number | string): Promise<DriverOrder> => {
    const driverId = resolveDriverId();
    const res = await apiClient.put<BackendOrderDto>(API_ENDPOINTS.ORDERS.STATUS(orderId), {
      statusCode: 'DRIVER_ACCEPTED',
      reason: `Tài xế #${driverId} đã nhận đơn giao hàng`,
    });

    const accepted = res?.data;
    if (!accepted || !accepted.id) {
      throw new Error(res?.message || 'Không nhận được thông tin đơn hàng từ máy chủ.');
    }

    if (
      accepted.driverId !== undefined &&
      accepted.driverId !== null &&
      Number(accepted.driverId) !== Number(driverId)
    ) {
      throw new Error('Đơn hàng này đã được một tài xế khác nhận trước. Vui lòng chọn đơn khác!');
    }

    const shopMap = await fetchRestaurantDirectoryMap([accepted.restaurantId]);
    return mapOrderToDriverOrder(accepted, shopMap);
  },

  // 3. Chỉnh sửa trạng thái cuốc xe (PICKING_UP -> DELIVERING -> COMPLETED hoặc DRIVER_REJECTED)
  updateStatus: async (
    orderId: number | string,
    statusCode: string,
    reason?: string
  ): Promise<DriverOrder> => {
    const driverId = resolveDriverId();
    const normalizedStatus = statusCode.trim().toUpperCase();
    const defaultReasonMap: Record<string, string> = {
      PICKING_UP: `Tài xế #${driverId} đã tới quán và đang lấy món`,
      DELIVERING: `Tài xế #${driverId} đã lấy món và đang giao tới khách hàng`,
      COMPLETED: `Tài xế #${driverId} đã giao hàng thành công`,
      DRIVER_REJECTED: `Tài xế #${driverId} trả đơn`,
    };

    const res = await apiClient.put<BackendOrderDto>(API_ENDPOINTS.ORDERS.STATUS(orderId), {
      statusCode: normalizedStatus,
      reason: reason?.trim() || defaultReasonMap[normalizedStatus] || `Cập nhật trạng thái ${normalizedStatus}`,
    });

    const updated = res?.data;
    if (!updated || !updated.id) {
      throw new Error(res?.message || 'Không thể cập nhật trạng thái đơn hàng.');
    }

    const shopMap = await fetchRestaurantDirectoryMap([updated.restaurantId]);
    return mapOrderToDriverOrder(updated, shopMap);
  },

  // 4. Lấy thông tin ví & các chuyến gần đây từ lịch sử đơn thật của tài xế
  getWalletSummary: async (explicitDriverId?: number | string): Promise<DriverWalletSummary> => {
    const dashboard = await driverApi.getHistoryDashboard({ driverId: explicitDriverId, period: 'all' });
    const completedTrips = dashboard.trips.filter((trip) => trip.isSuccess);

    return {
      todayEarnings: dashboard.stats.todayEarnings,
      completedTripsToday: dashboard.stats.completedTripsToday,
      tipsToday: dashboard.stats.tipsToday,
      walletBalance: dashboard.stats.walletBalance,
      recentTrips: completedTrips.slice(0, 5).map((trip) => {
        const parsedDate = new Date(trip.completedAtIso);
        const timeStr = Number.isNaN(parsedDate.getTime())
          ? trip.completedAt
          : parsedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        return {
          id: String(trip.id),
          orderCode: trip.orderCode,
          restaurantName: trip.restaurantName,
          address: trip.receiverAddress,
          time: timeStr,
          earning: trip.earnedFee,
        };
      }),
    };
  },

  // 5. Thống kê & danh sách đánh giá thật của tài xế từ review-service
  getReviewSummary: async (): Promise<DriverReviewSummary> => {
    try {
      const [summaryRes, listRes] = await Promise.all([
        apiClient.get<BackendReviewSummaryDto>(API_ENDPOINTS.REVIEWS.DRIVER_SUMMARY),
        apiClient.get<PaginatedData<BackendReviewDto>>(API_ENDPOINTS.REVIEWS.DRIVER_MINE, {
          params: { page: 0, size: 20 },
        }),
      ]);

      const summary = summaryRes?.data;
      const listData = listRes?.data;
      const rawReviews = Array.isArray(listData?.content)
        ? listData.content
        : Array.isArray(summary?.recentReviews)
        ? summary.recentReviews
        : [];

      const averageRating = Number(summary?.averageRating || 0);
      const totalReviews = Number(summary?.totalReviews ?? rawReviews.length ?? 0);

      let ratingRank = 'Chưa có đánh giá';
      if (totalReviews > 0) {
        if (averageRating >= 4.8) ratingRank = 'Tài xế xuất sắc';
        else if (averageRating >= 4.0) ratingRank = 'Tài xế tin cậy';
        else ratingRank = 'Đang cải thiện chất lượng';
      }

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingRank,
        reviews: rawReviews.map((rev) => ({
          id: rev.id,
          customerName: rev.customerName?.trim() || 'Khách hàng',
          rating: Number(rev.rating || 5),
          comment: rev.comment?.trim() || 'Khách hàng không để lại nhận xét.',
          orderCode: rev.orderId ? `#ORD-${rev.orderId}` : 'Đơn hàng',
          timeAgo: formatRelativeTimeVi(rev.createdAt),
        })),
      };
    } catch (error: any) {
      const status = error?.response?.status;
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingRank: 'Chưa thể tải xếp hạng',
        reviews: [],
        unavailableReason:
          status === 403
            ? 'Dịch vụ đánh giá tài xế hiện chưa cấp quyền truy cập trên container đang chạy.'
            : 'Không thể kết nối dịch vụ đánh giá tài xế.',
      };
    }
  },

  // 6. Tải đầy đủ Dashboard Lịch sử đơn hàng (Thành công + Thất bại/Hủy) & Thống kê thu nhập thật
  getHistoryDashboard: async (params?: DriverHistoryQueryParams): Promise<DriverHistoryDashboard> => {
    const driverId = resolveDriverId(params?.driverId);
    const rawOrders = await fetchAllDriverOrders(driverId);

    const historyOrders = rawOrders.filter((order) => isHistoryOrderStatus(order.statusCode));
    const shopMap = await fetchRestaurantDirectoryMap(historyOrders.map((o) => o.restaurantId));

    const allHistoryTrips = historyOrders
      .map((order) => mapOrderToTripHistory(order, shopMap))
      .sort(
        (a, b) =>
          new Date(b.completedAtIso).getTime() - new Date(a.completedAtIso).getTime()
      );

    return {
      stats: computeDriverStatistics(allHistoryTrips),
      trips: filterDriverTripHistory(allHistoryTrips, params),
    };
  },

  // 7. Thống kê thu nhập tích lũy theo ngày và tuần (tương thích chữ ký cũ)
  getIncomeStatistics: async (driverId?: number | string): Promise<DriverIncomeStatistics> => {
    const dashboard = await driverApi.getHistoryDashboard({ driverId, period: 'all' });
    return dashboard.stats;
  },

  // 8. Lấy danh sách lịch sử các cuốc xe (tương thích chữ ký cũ, bao gồm thành công & thất bại)
  getTripHistory: async (params?: DriverHistoryQueryParams): Promise<DriverTripHistory[]> => {
    const dashboard = await driverApi.getHistoryDashboard(params);
    return dashboard.trips;
  },
};
