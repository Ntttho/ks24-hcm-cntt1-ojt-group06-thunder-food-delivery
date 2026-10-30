import type { CartItem, CartState } from '@/store/slices/cartSlice';

export const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: 'item-1',
    productId: 101,
    productName: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    price: 87000,
    quantity: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400&auto=format&fit=crop',
    shopId: 1,
    shopName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
    toppings: [{ id: 1, name: 'Thêm ốp la chín lòng đào', price: 8000 }],
  },
  {
    id: 'item-2',
    productId: 102,
    productName: 'Canh Khổ Qua Nhồi Thịt',
    price: 35000,
    quantity: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=400&auto=format&fit=crop',
    shopId: 1,
    shopName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
  },
  {
    id: 'item-3',
    productId: 103,
    productName: 'Trà Tắc Xí Muội Khổng Lồ',
    price: 25000,
    quantity: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=400&auto=format&fit=crop',
    shopId: 1,
    shopName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
  },
];

export const buildMockCartState = (): CartState => {
  const totalQuantity = MOCK_CART_ITEMS.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = MOCK_CART_ITEMS.reduce((sum, item) => {
    const toppingTotal = (item.toppings || []).reduce((tSum, topping) => tSum + topping.price, 0);
    return sum + (item.price + toppingTotal) * item.quantity;
  }, 0);

  return {
    items: MOCK_CART_ITEMS,
    shopId: 1,
    shopName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
    totalQuantity,
    totalAmount,
  };
};
