export interface OrderItemTopping {
  id: number;
  toppingId: number;
  name?: string;
  quantity?: number;
  price: number;
}

export interface OrderItem {
  id: number;
  foodId: number;
  foodName: string;
  quantity: number;
  priceAtOrder: number;
  toppings?: OrderItemTopping[];
}

export interface OrderStatusLog {
  id: number;
  fromStatus: string;
  toStatus: string;
  changedByUserId?: number;
  changedByRole?: string;
  reason?: string;
  createdAt: string;
}

export type OrderStatusCode =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'DRIVER_ACCEPTED'
  | 'DRIVER_REJECTED'
  | 'CONFIRMED'
  | 'PICKING_UP'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'TIMEOUT';

export interface OrderVoucherItem {
  voucherId: number;
  voucherCode: string;
  voucherCategory?: string;
  isSystemVoucher?: boolean;
  discountAmount?: number;
}

export interface CustomerOrder {
  id: number;
  orderCode: string;
  idempotencyKey?: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  restaurantId: number;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  driverId?: number;
  driverName?: string;
  driverPhone?: string;
  receiverAddress: string;
  note?: string;
  receiverLat?: number;
  receiverLng?: number;
  distanceKm?: number;
  subtotalAmount: number;
  taxAmount?: number;
  shippingFee: number;
  shippingDiscountAmount?: number;
  discountAmount?: number;
  voucherId?: number;
  voucherCode?: string;
  systemVoucherId?: number;
  systemVoucherCode?: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO' | 'WALLET' | string;
  statusCode: OrderStatusCode | string;
  statusLabel?: string;
  cancelReason?: string;
  createdAt: string;
  items: OrderItem[];
  statusLogs?: OrderStatusLog[];
  appliedVouchers?: OrderVoucherItem[];
}
