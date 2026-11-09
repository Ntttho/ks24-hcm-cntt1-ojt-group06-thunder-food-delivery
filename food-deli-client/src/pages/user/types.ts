export interface CartItemType {
  id: string;
  productId?: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  options?: string;
  toppings?: Array<{ id: number; name: string; price: number }>;
  note?: string;
  shopId?: number;
  shopName?: string;
  selected?: boolean;
}

export interface UpsellItemType {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface DeliveryAddressItem {
  id: string;
  label: string; // "Nhà riêng" | "Văn phòng" | "Bạn bè" | "Nhà bố mẹ"
  title: string;
  fullAddress: string;
  recipientName: string;
  phone: string;
  isDefault?: boolean;
}

export interface PaymentMethodItem {
  id: string; // 'vietqr' | 'cod' | 'momo' | 'zalopay' | 'visa'
  name: string;
  subtitle: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
  discountText?: string;
  extraInfo?: string;
}
