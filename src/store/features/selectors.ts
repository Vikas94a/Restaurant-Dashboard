import { RootState } from '../store';
import { createSelector } from '@reduxjs/toolkit';

// Restaurant Selectors
export const selectRestaurantState = (state: RootState) => state.restaurant;
export const selectRestaurantDetails = (state: RootState) => state.restaurant.details;
export const selectRestaurantStatus = (state: RootState) => state.restaurant.status;
export const selectRestaurantError = (state: RootState) => state.restaurant.error;
export const selectRestaurantHours = createSelector(
  selectRestaurantDetails,
  (details) => details?.openingHours ?? []
);
export const selectIsRestaurantOpen = createSelector(
  selectRestaurantDetails,
  (details) => details?.isOpen ?? false
);

// Cart Selectors
export const selectCartState = (state: RootState) => state.cart;
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) => state.cart.total;
export const selectCartItemCount = createSelector(
  selectCartItems,
  (items) => items.reduce((count, item) => count + item.quantity, 0)
);
export const selectCartStatus = (state: RootState) => state.cart.status;
export const selectCartError = (state: RootState) => state.cart.error;

// Order Selectors
export const selectOrderState = (state: RootState) => state.orders;
export const selectOrders = (state: RootState) => state.orders.orders;
export const selectOrderStatus = (state: RootState) => state.orders.status;
export const selectOrderError = (state: RootState) => state.orders.error;
export const selectActiveOrder = createSelector(
  selectOrders,
  (orders) => orders.find(order => order.status === 'pending' || order.status === 'confirmed')
);

// Auth Selectors
export const selectAuthState = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error; 