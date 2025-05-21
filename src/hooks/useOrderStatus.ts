import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/checkout';
import { toast } from 'sonner';

/**
 * Hook for managing and listening to order status changes
 */
export const useOrderStatus = (restaurantId: string | null | undefined) => {
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Listen for order status changes using the placedOrder state
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true; // Flag to track if the component is mounted

    // Setup order listener when placedOrder.id and restaurantId are available
    if (placedOrder?.id && restaurantId && isMounted) {
      console.log(`Setting up listener for Order ID: ${placedOrder.id} on Restaurant ID: ${restaurantId}`);

      unsubscribe = onSnapshot(
        doc(db, "restaurants", restaurantId, "orders", placedOrder.id),
        (docSnap) => {
          if (docSnap.exists() && isMounted) { 
            const data = docSnap.data() as Order;
            console.log(`Received order update for ${placedOrder.id}:`, data);
            
            // Update the entire placedOrder state with the latest data from Firestore
            setPlacedOrder(prev => prev ? { ...prev, ...data } : data);
            
            // Show toast only when status changes
            if (placedOrder?.status !== data.status) {
              if (data.status === 'accepted') {
                toast.success('Your order has been accepted! 🎉');
              } else if (data.status === 'rejected') {
                toast.error('Sorry, your order was rejected.');
              }
            }
          } else if (!docSnap.exists() && isMounted) {
            console.warn(`Order document ${placedOrder.id} no longer exists.`);
          }
        },
        (error) => {
          if (isMounted) {
            console.error('Error listening to order status:', error);
            toast.error('Error checking order status');
          }
        }
      );
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribe) {
        console.log(`Cleaning up listener for Order ID: ${placedOrder?.id}`);
        unsubscribe();
      }
    };
  }, [placedOrder?.id, restaurantId]);

  return {
    showOrderStatus,
    setShowOrderStatus,
    placedOrder,
    setPlacedOrder
  };
};

export default useOrderStatus;
