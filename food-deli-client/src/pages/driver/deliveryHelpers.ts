export type RouteMapFocus = 'pickup' | 'dropoff' | 'route';

export interface DriverDeliveryStageInfo {
  stage: 'PICKUP' | 'DELIVERING' | 'OTHER';
  stepIndex: 1 | 2 | 3;
  title: string;
  subtitle: string;
  ctaLabel: string;
  canReturnOrder: boolean;
}

export interface DriverChatMessage {
  id: string;
  orderId: number;
  sender: 'DRIVER' | 'CUSTOMER' | 'SYSTEM';
  text: string;
  sentAtIso: string;
}

export const QUICK_CHAT_REPLIES = [
  'Tôi đang trên đường giao tới bạn',
  'Tôi đã tới trước cửa nhà/tòa nhà',
  'Xin lỗi bạn đường hơi kẹt xe',
] as const;

const CHAT_STORAGE_PREFIX = 'driver_order_chat_';

/**
 * Chuẩn hóa truy vấn tọa độ (ưu tiên lat,lng hợp lệ) hoặc fallback sang chuỗi địa chỉ.
 */
export const buildLocationQuery = (
  lat?: number | null,
  lng?: number | null,
  fallbackAddress?: string | null
): string => {
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001)
  ) {
    return `${lat},${lng}`;
  }
  return (fallbackAddress || '').trim();
};

/**
 * Tạo đường dẫn mở Google Maps dẫn đường (chế độ xe máy / 2 bánh).
 */
export const buildGoogleMapsDirectionsUrl = (options: {
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationAddress?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  originAddress?: string | null;
}): string => {
  const dest = buildLocationQuery(
    options.destinationLat,
    options.destinationLng,
    options.destinationAddress
  );
  const origin = buildLocationQuery(
    options.originLat,
    options.originLng,
    options.originAddress
  );

  const params = new URLSearchParams({ api: '1', travelmode: 'two-wheeler' });
  if (dest) {
    params.set('destination', dest);
  }
  if (origin) {
    params.set('origin', origin);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

/**
 * Tạo URL iframe Google Maps nhúng trực tiếp cho chặng tới quán, giao khách, hoặc toàn lộ trình.
 */
export const buildGoogleMapsEmbedUrl = (params: {
  mode: RouteMapFocus;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupAddress?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffAddress?: string | null;
}): string | null => {
  const pickupQuery = buildLocationQuery(
    params.pickupLat,
    params.pickupLng,
    params.pickupAddress
  );
  const dropoffQuery = buildLocationQuery(
    params.dropoffLat,
    params.dropoffLng,
    params.dropoffAddress
  );

  if (params.mode === 'route' && pickupQuery && dropoffQuery) {
    return `https://maps.google.com/maps?saddr=${encodeURIComponent(
      pickupQuery
    )}&daddr=${encodeURIComponent(dropoffQuery)}&hl=vi&output=embed`;
  }

  const singleTarget =
    params.mode === 'dropoff'
      ? dropoffQuery || pickupQuery
      : pickupQuery || dropoffQuery;

  if (!singleTarget) {
    return null;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(singleTarget)}&hl=vi&z=16&output=embed`;
};

/**
 * Chuẩn hóa thông tin tiến trình 2 mốc cho SP3-DRV-04:
 * - Mốc 1 (DRIVER_ACCEPTED / PICKING_UP): TỚI QUÁN -> nút cam "TÔI ĐÃ ĐẾN QUÁN LẤY MÓN"
 * - Mốc 2 (DELIVERING): GIAO KHÁCH -> nút xanh lá "GIAO THÀNH CÔNG & THU TIỀN COD"
 */
export const getDeliveryStageInfo = (statusCode?: string | null): DriverDeliveryStageInfo => {
  const normalized = (statusCode || '').trim().toUpperCase();

  if (normalized === 'DRIVER_ACCEPTED' || normalized === 'PICKING_UP') {
    return {
      stage: 'PICKUP',
      stepIndex: 1,
      title: 'Chặng 1: Di chuyển tới quán lấy món',
      subtitle:
        normalized === 'PICKING_UP'
          ? 'Đang ở quán kiểm món — bấm nút cam để xác nhận bắt đầu đi giao.'
          : 'Tới quán nhận đồ ăn và bấm nút cam bên dưới để bắt đầu giao hàng.',
      ctaLabel: 'TÔI ĐÃ ĐẾN QUÁN LẤY MÓN',
      canReturnOrder: normalized === 'DRIVER_ACCEPTED',
    };
  }

  if (normalized === 'DELIVERING') {
    return {
      stage: 'DELIVERING',
      stepIndex: 2,
      title: 'Chặng 2: Đang giao món tới khách hàng',
      subtitle: 'Giao tận tay khách hàng, kiểm tra thanh toán và bấm nút xanh để hoàn tất.',
      ctaLabel: 'GIAO THÀNH CÔNG & THU TIỀN COD',
      canReturnOrder: false,
    };
  }

  return {
    stage: 'OTHER',
    stepIndex: 3,
    title: 'Đang cập nhật tiến trình đơn',
    subtitle: 'Trạng thái đơn hàng đang được đồng bộ.',
    ctaLabel: 'TIẾP TỤC',
    canReturnOrder: false,
  };
};

export interface ChatStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const getDefaultStorage = (): ChatStorageLike | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

export const getOrderChatStorageKey = (orderId: number | string): string =>
  `${CHAT_STORAGE_PREFIX}${orderId}`;

export const loadOrderChatMessages = (
  orderId: number | string,
  storageImpl: ChatStorageLike | null = getDefaultStorage()
): DriverChatMessage[] => {
  if (!storageImpl) return [];
  try {
    const raw = storageImpl.getItem(getOrderChatStorageKey(orderId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveOrderChatMessages = (
  orderId: number | string,
  messages: DriverChatMessage[],
  storageImpl: ChatStorageLike | null = getDefaultStorage()
): void => {
  if (!storageImpl) return;
  try {
    storageImpl.setItem(getOrderChatStorageKey(orderId), JSON.stringify(messages));
  } catch {
    // Ignore storage quota errors
  }
};

export const createDriverChatMessage = (
  orderId: number,
  text: string,
  nowIso: string = new Date().toISOString()
): DriverChatMessage => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  orderId,
  sender: 'DRIVER',
  text: text.trim(),
  sentAtIso: nowIso,
});

