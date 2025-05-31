import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import authReducer, { AuthState } from './features/authSlice';
import cartReducer, { CartState } from './features/cartSlice';
import ordersReducer from './features/orderSlice';
import restaurantReducer, { RestaurantState } from './features/restaurantSlice';
import menuReducer, { MenuState } from './features/menuSlice';
import { OrderState } from './features/orderSlice';
import { errorMiddleware } from './middleware/errorMiddleware';

export interface RootState {
  auth: AuthState;
  cart: CartState;
  orders: OrderState;
  restaurant: RestaurantState;
  menu: MenuState;
}

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  orders: ordersReducer,
  restaurant: restaurantReducer,
  menu: menuReducer
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'cart'] // Only persist auth and cart
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(errorMiddleware),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type AppGetState = typeof store.getState;