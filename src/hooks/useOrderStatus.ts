import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Order } from '@/types/checkout';

// Types
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface OrderStatusState {
  status: OrderStatus | null;
  loading: boolean;
  error: string | null;
}

export interface UseOrderStatusReturn {
  showOrderStatus: boolean;
  setShowOrderStatus: (show: boolean) => void;
  placedOrder: Order | null;
  setPlacedOrder: (order: Order | null) => void;
}

// Error message mapping for order operations
const ORDER_ERROR_MESSAGES = {
  'not-found': 'Order not found. Please try again.',
  'permission-denied': 'You do not have permission to update this order.',
  'unavailable': 'Order service is currently unavailable.',
  'invalid-data': 'Invalid order data received.',
  'network-error': 'Network error. Please check your connection.',
  'update-failed': 'Failed to update order status. Please try again.',
  'invalid-status': 'Invalid order status provided.',
  'default': 'An unexpected error occurred while processing the order.'
} as const;

// Helper function to get user-friendly error message
const getOrderErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = error.code as keyof typeof ORDER_ERROR_MESSAGES;
    return ORDER_ERROR_MESSAGES[code] || ORDER_ERROR_MESSAGES.default;
  }
  return ORDER_ERROR_MESSAGES.default;
};

// Validate order status
const isValidOrderStatus = (status: string): status is OrderStatus => {
  return ['pending', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status);
};

/**
 * Hook for managing and listening to order status changes
 */
export const useOrderStatus = (restaurantId: string | null): UseOrderStatusReturn => {
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  return {
    showOrderStatus,
    setShowOrderStatus,
    placedOrder,
    setPlacedOrder
  };
};

export default useOrderStatus;
