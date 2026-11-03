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
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CustomerOrder {
  id: number;
  orderCode: string;
  idempotencyKey?: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  restaurantId: number;
  restaurantName?: string;
  driverId?: number;
  driverName?: string;
  driverPhone?: string;
  receiverAddress: string;
  receiverLat?: number;
  receiverLng?: number;
  distanceKm?: number;
  subtotalAmount: number;
  taxAmount?: number;
  shippingFee: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO' | 'WALLET' | string;
  statusCode: OrderStatusCode | string;
  statusLabel?: string;
  cancelReason?: string;
  createdAt: string;
  items: OrderItem[];
  statusLogs?: OrderStatusLog[];
}
