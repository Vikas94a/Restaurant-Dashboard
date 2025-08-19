import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { subscribeToRestaurantOrders, clearOrders, setOrders } from '@/store/features/orderSlice';
import { useSoundNotification } from '@/providers/SoundNotificationProvider';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/checkout';
import { toast } from 'sonner';

export const useGlobalOrderListener = () => {
  const dispatch = useAppDispatch();
  const { user, restaurantDetails } = useAppSelector((state) => state.auth);
  const { orders } = useAppSelector((state) => state.orders);
  const { startRepeatingSound, stopRepeatingSound } = useSoundNotification();
  
  const previousOrderCountRef = useRef(0);
  const isInitializedRef = useRef(false);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  // Subscribe to restaurant orders
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user && restaurantDetails?.restaurantId) {
      unsubscribe = dispatch(
        subscribeToRestaurantOrders(restaurantDetails.restaurantId)
      );
    } else {
      dispatch(clearOrders());
    }

    return () => {
      if (unsubscribe) unsubscribe();
      dispatch(clearOrders());
    };
  }, [dispatch, restaurantDetails?.restaurantId, user]);

  // Listen for real-time order updates only for notifications (state is populated by subscribeToRestaurantOrders)
  useEffect(() => {
    if (!restaurantDetails?.restaurantId) return;

    const ordersRef = collection(db, 'restaurants', restaurantDetails.restaurantId, 'orders');
    const q = query(ordersRef, where('restaurantId', '==', restaurantDetails.restaurantId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status as string,
        } as Pick<Order, 'id' | 'status'> as Order;
      });

      // Check for new pending orders
      const pendingOrders = ordersData.filter(
        (order: Order) => (order.status as string) === 'pending'
      );

      // Get current pending order IDs
      const currentPendingOrderIds = new Set(pendingOrders.map(order => order.id));

      // If this is the first load, just set the initial state
      if (!isInitializedRef.current) {
        previousOrderCountRef.current = pendingOrders.length;
        previousOrderIdsRef.current = currentPendingOrderIds;
        isInitializedRef.current = true;
        return;
      }

      // Check if new pending orders arrived
      const hasNewPendingOrders = pendingOrders.length > previousOrderCountRef.current;
      const hasNewOrderIds = pendingOrders.some(order => !previousOrderIdsRef.current.has(order.id));

      if ((hasNewPendingOrders || hasNewOrderIds) && pendingOrders.length > 0) {
        startRepeatingSound();
        toast.success('🎉 Ny bestilling mottatt!', {
          duration: 4000,
          position: 'top-right',
        });
      }

      // Update previous state
      previousOrderCountRef.current = pendingOrders.length;
      previousOrderIdsRef.current = currentPendingOrderIds;
    });

    return () => unsubscribe();
  }, [restaurantDetails?.restaurantId, startRepeatingSound]);

  // Stop sound when no pending orders
  useEffect(() => {
    const pendingOrders = orders.filter(
      (order: Order) => (order.status as string) === 'pending'
    );
    
    if (pendingOrders.length === 0) {
      stopRepeatingSound();
    }
  }, [orders, stopRepeatingSound]);

  return null;
}; 