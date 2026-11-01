export interface FoodItem {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageUrl: string;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
  soldCount?: number;
}

export interface StoreDetail {
  id: number | string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  openTime: string;
  closeTime: string;
  deliveryTime: string;
  distance: string;
  shippingFee: number;
  coverImageUrl: string;
  avatarUrl: string;
  tags: string[];
  isVerified?: boolean;
}

