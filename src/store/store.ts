import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import cartReducer from './features/cartSlice';
import ordersReducer from './features/orderSlice';
import restaurantReducer from './features/restaurantSlice';
import { OrderState } from './features/orderSlice';

export interface RootState {
  auth: any; // Replace with your auth state type
  cart: any; // Replace with your cart state type
  orders: OrderState;
  restaurant: {
    hours: any[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    orders: ordersReducer,
    restaurant: restaurantReducer,
  },
});

export type AppDispatch = typeof store.dispatch;