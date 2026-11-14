export interface CustomizationOption {
  id: number;
  name: string;
  price: number;
}

export interface CustomizationGroup {
  id: number;
  name: string;
  required?: boolean;
  multiple?: boolean;
  options: CustomizationOption[];
}

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
  isAvailable?: boolean;
  currentQuantity?: number;
  defaultQuantity?: number;
  soldCount?: number;
  customizationGroups?: CustomizationGroup[];
}

export interface RestaurantDetail {
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
