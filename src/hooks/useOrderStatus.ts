import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

// Types
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface OrderStatusState {
  status: OrderStatus | null;
  loading: boolean;
  error: string | null;
}

interface UseOrderStatusReturn extends OrderStatusState {
  updateStatus: (newStatus: OrderStatus) => Promise<void>;
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
export const useOrderStatus = (orderId: string): UseOrderStatusReturn => {
  const [state, setState] = useState<OrderStatusState>({
    status: null,
    loading: true,
    error: null
  });

  // Update state with proper type safety
  const updateState = useCallback((updates: Partial<OrderStatusState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    if (!orderId) {
      updateState({
        error: 'Order ID is required',
        loading: false
      });
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupOrderListener = async () => {
      try {
        updateState({ loading: true, error: null });

        const orderRef = doc(db, 'orders', orderId);
        unsubscribe = onSnapshot(
          orderRef,
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              const status = data.status;
              
              if (isValidOrderStatus(status)) {
                updateState({ status, loading: false });
              } else {
                const errorMessage = ORDER_ERROR_MESSAGES['invalid-data'];
                updateState({ error: errorMessage, loading: false });
                toast.error(errorMessage);
              }
            } else {
              const errorMessage = ORDER_ERROR_MESSAGES['not-found'];
              updateState({ error: errorMessage, loading: false });
              toast.error(errorMessage);
            }
          },
          (error) => {
            console.error('[Order] Error fetching order status:', error);
            const errorMessage = getOrderErrorMessage(error);
            updateState({ error: errorMessage, loading: false });
            toast.error(errorMessage);
          }
        );
      } catch (error) {
        console.error('[Order] Error setting up order status listener:', error);
        const errorMessage = getOrderErrorMessage(error);
        updateState({ error: errorMessage, loading: false });
        toast.error(errorMessage);
      }
    };

    setupOrderListener();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [orderId, updateState]);

  const updateStatus = useCallback(async (newStatus: OrderStatus) => {
    if (!orderId) {
      toast.error('Order ID is required');
      return;
    }

    if (!isValidOrderStatus(newStatus)) {
      const errorMessage = ORDER_ERROR_MESSAGES['invalid-status'];
      updateState({ error: errorMessage });
      toast.error(errorMessage);
      return;
    }

    try {
      updateState({ loading: true, error: null });

      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('[Order] Error updating order status:', error);
      const errorMessage = getOrderErrorMessage(error);
      updateState({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      updateState({ loading: false });
    }
  }, [orderId, updateState]);

  return {
    ...state,
    updateStatus
  };
};

export default useOrderStatus;
