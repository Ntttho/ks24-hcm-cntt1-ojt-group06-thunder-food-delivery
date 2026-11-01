import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { storage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/constants';

export interface CartItem {
  id: string; // unique item id (productId + topping combo)
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  shopId: number;
  shopName: string;
  toppings?: Array<{ id: number; name: string; price: number }>;
}

export interface CartState {
  items: CartItem[];
  shopId: number | null;
  shopName: string | null;
  totalQuantity: number;
  totalAmount: number;
}

const savedCart = storage.get<CartState>(STORAGE_KEYS.CART);

const initialState: CartState = savedCart || {
  items: [],
  shopId: null,
  shopName: null,
  totalQuantity: 0,
  totalAmount: 0,
};

const calculateTotals = (items: CartItem[]) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => {
    const toppingTotal = (item.toppings || []).reduce((tSum, t) => tSum + t.price, 0);
    return sum + (item.price + toppingTotal) * item.quantity;
  }, 0);
  return { totalQuantity, totalAmount };
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;

      // If cart has items from a different shop, reset cart to new shop
      if (state.shopId && state.shopId !== newItem.shopId) {
        state.items = [newItem];
        state.shopId = newItem.shopId;
        state.shopName = newItem.shopName;
      } else {
        state.shopId = newItem.shopId;
        state.shopName = newItem.shopName;
        const existingIndex = state.items.findIndex((item) => item.id === newItem.id);
        if (existingIndex > -1) {
          state.items[existingIndex].quantity += newItem.quantity;
        } else {
          state.items.push(newItem);
        }
      }

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      storage.set(STORAGE_KEYS.CART, state);
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const { id, quantity } = action.payload;
      const index = state.items.findIndex((item) => item.id === id);
      if (index > -1) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = quantity;
        }
      }

      if (state.items.length === 0) {
        state.shopId = null;
        state.shopName = null;
      }

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      storage.set(STORAGE_KEYS.CART, state);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      if (state.items.length === 0) {
        state.shopId = null;
        state.shopName = null;
      }
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      storage.set(STORAGE_KEYS.CART, state);
    },

    clearCart: (state) => {
      state.items = [];
      state.shopId = null;
      state.shopName = null;
      state.totalQuantity = 0;
      state.totalAmount = 0;
      storage.remove(STORAGE_KEYS.CART);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
