import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
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

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  // Only persist the auth state
  whitelist: ['auth']
};

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  orders: ordersReducer,
  restaurant: restaurantReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;