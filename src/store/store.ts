import { configureStore } from '@reduxjs/toolkit';
import authReducer, { AuthState } from './features/authSlice';
import cartReducer, { CartState } from './features/cartSlice';
import ordersReducer from './features/orderSlice';
import restaurantReducer, { RestaurantState } from './features/restaurantSlice';
import { OrderState } from './features/orderSlice';

export interface RootState {
  auth: AuthState;
  cart: CartState;
  orders: OrderState;
  restaurant: RestaurantState;
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