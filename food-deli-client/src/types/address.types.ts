export interface UserAddress {
  id: number;
  userId: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  label?: string | null;
  createdAt?: string;
}

export interface AddressRequest {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
  label?: string | null;
}
