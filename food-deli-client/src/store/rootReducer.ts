import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import cartReducer from './slices/cartSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  cart: cartReducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
