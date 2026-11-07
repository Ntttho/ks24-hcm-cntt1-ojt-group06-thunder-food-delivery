import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { storage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/constants';
import { cartApi, type BackendCartItem, type AddItemToCartPayload } from '@/services/modules/cartApi';

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
  selected?: boolean;
}

export interface CartState {
  items: CartItem[];
  shopId: number | null;
  shopName: string | null;
  totalQuantity: number;
  totalAmount: number;
  selectedQuantity: number;
  isLoading?: boolean;
}

const savedCart = storage.get<CartState>(STORAGE_KEYS.CART);

const calculateTotals = (items: CartItem[]) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const selectedItems = items.filter((item) => item.selected !== false);
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = selectedItems.reduce((sum, item) => {
    const toppingTotal = (item.toppings || []).reduce((tSum, t) => tSum + t.price, 0);
    return sum + (item.price + toppingTotal) * item.quantity;
  }, 0);
  return { totalQuantity, totalAmount, selectedQuantity };
};

const initialTotals = savedCart?.items ? calculateTotals(savedCart.items) : { totalQuantity: 0, totalAmount: 0, selectedQuantity: 0 };

const initialState: CartState = {
  items: savedCart?.items || [],
  shopId: savedCart?.shopId || null,
  shopName: savedCart?.shopName || null,
  totalQuantity: initialTotals.totalQuantity,
  totalAmount: initialTotals.totalAmount,
  selectedQuantity: initialTotals.selectedQuantity,
  isLoading: false,
};

/**
 * Async Thunk: Tải giỏ hàng từ Redis về Redux Store
 */
export const fetchCartFromRedis = createAsyncThunk(
  'cart/fetchFromRedis',
  async (userId: number | undefined, { rejectWithValue }) => {
    try {
      const res = await cartApi.getCart(userId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

/**
 * Async Thunk: Đồng bộ toàn bộ giỏ hàng từ Redux lên Redis
 */
export const syncCartToRedis = createAsyncThunk(
  'cart/syncToRedis',
  async (
    payload: { shopId: number | null; shopName: string | null; items: CartItem[]; userId?: number },
    { rejectWithValue }
  ) => {
    try {
      const backendItems: BackendCartItem[] = payload.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        shopId: item.shopId,
        shopName: item.shopName,
        toppings: item.toppings,
      }));
      const res = await cartApi.syncCart(payload.shopId, payload.shopName, backendItems, payload.userId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

/**
 * Async Thunk: Thêm món vào giỏ hàng trên Redis và cập nhật Redux
 */
export const addToCartAsync = createAsyncThunk(
  'cart/addToCartAsync',
  async (
    payload: { item: CartItem; replaceCart?: boolean; userId?: number },
    { dispatch, rejectWithValue }
  ) => {
    dispatch(cartSlice.actions.addToCart(payload.item));
    try {
      const apiPayload: AddItemToCartPayload = {
        productId: payload.item.productId,
        productName: payload.item.productName,
        price: payload.item.price,
        quantity: payload.item.quantity,
        imageUrl: payload.item.imageUrl,
        shopId: payload.item.shopId,
        shopName: payload.item.shopName,
        toppings: payload.item.toppings,
        replaceCart: payload.replaceCart || false,
      };
      const res = await cartApi.addItem(apiPayload, payload.userId);
      return res.data;
    } catch (err: any) {
      console.warn('[Cart] Error adding item to Redis cart:', err?.message || err);
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

/**
 * Async Thunk: Cập nhật số lượng món trên Redis và Redux
 */
export const updateQuantityAsync = createAsyncThunk(
  'cart/updateQuantityAsync',
  async (
    payload: { id: string; quantity: number; userId?: number },
    { dispatch, rejectWithValue }
  ) => {
    dispatch(cartSlice.actions.updateQuantity({ id: payload.id, quantity: payload.quantity }));
    try {
      const res = await cartApi.updateQuantity(payload.id, payload.quantity, payload.userId);
      return res.data;
    } catch (err: any) {
      console.warn('[Cart] Error updating quantity in Redis cart:', err?.message || err);
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

/**
 * Async Thunk: Xóa món khỏi giỏ trên Redis và Redux
 */
export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCartAsync',
  async (
    payload: { id: string; userId?: number },
    { dispatch, rejectWithValue }
  ) => {
    dispatch(cartSlice.actions.removeFromCart(payload.id));
    try {
      const res = await cartApi.removeItem(payload.id, payload.userId);
      return res.data;
    } catch (err: any) {
      console.warn('[Cart] Error removing item from Redis cart:', err?.message || err);
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

/**
 * Async Thunk: Xóa sạch giỏ hàng trên Redis và Redux
 */
export const clearCartAsync = createAsyncThunk(
  'cart/clearCartAsync',
  async (userId: number | undefined, { dispatch, rejectWithValue }) => {
    dispatch(cartSlice.actions.clearCart());
    try {
      const res = await cartApi.clearCart(userId);
      return res.data;
    } catch (err: any) {
      console.warn('[Cart] Error clearing Redis cart:', err?.message || err);
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartState: (state, action: PayloadAction<Partial<CartState>>) => {
      if (action.payload.items !== undefined) {
        state.items = action.payload.items;
      }
      if (action.payload.shopId !== undefined) {
        state.shopId = action.payload.shopId;
      }
      if (action.payload.shopName !== undefined) {
        state.shopName = action.payload.shopName;
      }
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.selectedQuantity = totals.selectedQuantity;
      storage.set(STORAGE_KEYS.CART, state);
    },

    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = { ...action.payload };
      if (newItem.selected === undefined) {
        newItem.selected = true;
      }

      const existingIndex = state.items.findIndex((item) => item.id === newItem.id);
      if (existingIndex > -1) {
        state.items[existingIndex].quantity += newItem.quantity;
      } else {
        // If there are already selected items from another restaurant, deselect them so focus moves to newly added item
        const hasSelectedOtherShop = state.items.some(
          (i) => i.selected && i.shopId !== newItem.shopId
        );
        if (hasSelectedOtherShop) {
          state.items.forEach((i) => {
            if (i.shopId !== newItem.shopId) {
              i.selected = false;
            }
          });
        }
        newItem.selected = true;
        state.items.push(newItem);
      }

      state.shopId = newItem.shopId;
      state.shopName = newItem.shopName;

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.selectedQuantity = totals.selectedQuantity;
      storage.set(STORAGE_KEYS.CART, state);
    },

    toggleSelectItem: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const targetItem = state.items.find((item) => item.id === id);
      if (!targetItem) return;

      const nextVal = !targetItem.selected;
      targetItem.selected = nextVal;

      // In Food Delivery: One delivery trip only picks up from 1 restaurant.
      // If user checks an item from shop B, deselect items from all other shops!
      if (nextVal) {
        state.items.forEach((item) => {
          if (item.shopId !== targetItem.shopId) {
            item.selected = false;
          }
        });
        state.shopId = targetItem.shopId;
        state.shopName = targetItem.shopName;
      }

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.selectedQuantity = totals.selectedQuantity;
      storage.set(STORAGE_KEYS.CART, state);
    },

    toggleSelectShop: (
      state,
      action: PayloadAction<{ shopId: number; selected: boolean }>
    ) => {
      const { shopId, selected } = action.payload;

      state.items.forEach((item) => {
        if (item.shopId === shopId) {
          item.selected = selected;
        } else if (selected) {
          item.selected = false;
        }
      });

      if (selected) {
        const first = state.items.find((i) => i.shopId === shopId);
        if (first) {
          state.shopId = first.shopId;
          state.shopName = first.shopName;
        }
      }

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.selectedQuantity = totals.selectedQuantity;
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
      state.selectedQuantity = totals.selectedQuantity;
      storage.set(STORAGE_KEYS.CART, state);

      if (quantity <= 0) {
        cartApi.removeItem(id).catch(() => {});
      } else {
        cartApi.updateQuantity(id, quantity).catch(() => {});
      }
    },

    updateItemToppings: (
      state,
      action: PayloadAction<{
        oldItemId: string;
        newItemId: string;
        toppings: Array<{ id: number; name: string; price: number }>;
        quantity?: number;
      }>
    ) => {
      const { oldItemId, newItemId, toppings, quantity } = action.payload;
      const index = state.items.findIndex((item) => item.id === oldItemId);
      if (index === -1) return;

      const itemToUpdate = state.items[index];
      const finalQuantity = quantity !== undefined && quantity > 0 ? quantity : itemToUpdate.quantity;

      if (oldItemId !== newItemId) {
        const existingTargetIndex = state.items.findIndex((item) => item.id === newItemId);
        if (existingTargetIndex > -1 && existingTargetIndex !== index) {
          state.items[existingTargetIndex].quantity += finalQuantity;
          state.items.splice(index, 1);
        } else {
          state.items[index].id = newItemId;
          state.items[index].toppings = toppings;
          state.items[index].quantity = finalQuantity;
        }
      } else {
        state.items[index].toppings = toppings;
        state.items[index].quantity = finalQuantity;
      }

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.selectedQuantity = totals.selectedQuantity;
      storage.set(STORAGE_KEYS.CART, state);

      cartApi.syncCart(
        state.shopId,
        state.shopName,
        state.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          price: it.price,
          quantity: it.quantity,
          imageUrl: it.imageUrl,
          shopId: it.shopId,
          shopName: it.shopName,
          toppings: it.toppings,
        }))
      ).catch(() => {});
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.items = state.items.filter((item) => item.id !== id);
      if (state.items.length === 0) {
        state.shopId = null;
        state.shopName = null;
      }
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.selectedQuantity = totals.selectedQuantity;
      storage.set(STORAGE_KEYS.CART, state);

      cartApi.removeItem(id).catch(() => {});
    },

    clearPurchasedItems: (state, action: PayloadAction<string[] | undefined>) => {
      const purchasedIds = action.payload;
      if (purchasedIds && purchasedIds.length > 0) {
        state.items = state.items.filter((item) => !purchasedIds.includes(item.id));
      } else {
        state.items = state.items.filter((item) => item.selected === false);
      }

      const remainingSelected = state.items.find((i) => i.selected);
      if (remainingSelected) {
        state.shopId = remainingSelected.shopId;
        state.shopName = remainingSelected.shopName;
      } else if (state.items.length > 0) {
        state.shopId = state.items[0].shopId;
        state.shopName = state.items[0].shopName;
      } else {
        state.shopId = null;
        state.shopName = null;
      }

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.selectedQuantity = totals.selectedQuantity;
      storage.set(STORAGE_KEYS.CART, state);

      if (state.items.length === 0) {
        cartApi.clearCart().catch(() => {});
      } else {
        cartApi.syncCart(
          state.shopId,
          state.shopName,
          state.items.map((it) => ({
            id: it.id,
            productId: it.productId,
            productName: it.productName,
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.imageUrl,
            shopId: it.shopId,
            shopName: it.shopName,
            toppings: it.toppings,
          }))
        ).catch(() => {});
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.shopId = null;
      state.shopName = null;
      state.totalQuantity = 0;
      state.totalAmount = 0;
      state.selectedQuantity = 0;
      storage.remove(STORAGE_KEYS.CART);

      cartApi.clearCart().catch(() => {});
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartFromRedis.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCartFromRedis.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload && action.payload.items && action.payload.items.length > 0) {
          state.shopId = action.payload.shopId || null;
          state.shopName = action.payload.shopName || null;
          const activeShopId = action.payload.shopId || action.payload.items[0]?.shopId;
          state.items = action.payload.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            shopId: item.shopId,
            shopName: item.shopName || '',
            toppings: item.toppings,
            selected: item.shopId === activeShopId,
          }));
          const totals = calculateTotals(state.items);
          state.totalQuantity = totals.totalQuantity;
          state.totalAmount = totals.totalAmount;
          state.selectedQuantity = totals.selectedQuantity;
          storage.set(STORAGE_KEYS.CART, state);
        } else if (state.items.length > 0) {
          cartApi.syncCart(
            state.shopId,
            state.shopName,
            state.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
              shopId: item.shopId,
              shopName: item.shopName,
              toppings: item.toppings,
            }))
          ).catch(() => {});
        }
      })
      .addCase(fetchCartFromRedis.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const {
  setCartState,
  addToCart,
  toggleSelectItem,
  toggleSelectShop,
  updateQuantity,
  updateItemToppings,
  removeFromCart,
  clearPurchasedItems,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
