import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

// Error message mapping for order operations
const ORDER_ERROR_MESSAGES = {
  'not-found': 'Order not found. Please try again.',
  'permission-denied': 'You do not have permission to update this order.',
  'unavailable': 'Order service is currently unavailable.',
  'invalid-data': 'Invalid order data received.',
  'network-error': 'Network error. Please check your connection.',
  'update-failed': 'Failed to update order status. Please try again.',
  'default': 'An unexpected error occurred while processing the order.'
};

// Helper function to get user-friendly error message
const getOrderErrorMessage = (error: any): string => {
  if (error?.code) {
    return ORDER_ERROR_MESSAGES[error.code as keyof typeof ORDER_ERROR_MESSAGES] || ORDER_ERROR_MESSAGES.default;
  }
  return ORDER_ERROR_MESSAGES.default;
};

/**
 * Hook for managing and listening to order status changes
 */
export const useOrderStatus = (orderId: string) => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderRef = doc(db, 'orders', orderId);
      const unsubscribe = onSnapshot(
        orderRef,
        (doc) => {
          if (doc.exists()) {
            setStatus(doc.data().status);
          } else {
            setError('Order not found');
            toast.error('Order not found');
          }
          setLoading(false);
        },
        (error) => {
          console.error('[Order] Error fetching order status:', error);
          const errorMessage = getOrderErrorMessage(error);
          setError(errorMessage);
          toast.error(errorMessage);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error: any) {
      console.error('[Order] Error setting up order status listener:', error);
      const errorMessage = getOrderErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  }, [orderId]);

  const updateStatus = async (newStatus: string) => {
    if (!orderId) {
      toast.error('Order ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      toast.success('Order status updated successfully');
    } catch (error: any) {
      console.error('[Order] Error updating order status:', error);
      const errorMessage = getOrderErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, error, updateStatus };
};

export default useOrderStatus;
