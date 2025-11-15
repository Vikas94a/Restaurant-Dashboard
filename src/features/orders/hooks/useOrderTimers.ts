/**
 * Custom hook for managing order timers (ASAP and preparation timers)
 */

import { useEffect, useRef, useState } from 'react';
import { Order } from '@/types/checkout';
import { OrderTimer } from '../types';
import { autoCancelExpiredOrder } from '@/store/features/orderSlice';
import { useAppDispatch } from '@/store/hooks';

interface UseOrderTimersProps {
  orders: Order[];
  restaurantId?: string;
}

export function useOrderTimers({ orders, restaurantId }: UseOrderTimersProps) {
  const dispatch = useAppDispatch();
  const [asapTimers, setAsapTimers] = useState<Record<string, OrderTimer>>({});
  const [preparationTimers, setPreparationTimers] = useState<Record<string, OrderTimer>>({});
  const timerRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const prepTimerRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Timer management for ASAP orders
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    // Start timers for pending ASAP orders
    orders.forEach(order => {
      if (order.pickupOption === 'asap' && order.status === 'pending') {
        // Calculate time left from autoCancelAt or create one if missing
        let autoCancelTime: number;
        if (order.autoCancelAt) {
          autoCancelTime = new Date(order.autoCancelAt).getTime();
        } else {
          // If no autoCancelAt, set it to 3 minutes from order creation
          autoCancelTime = new Date(order.createdAt).getTime() + (3 * 60 * 1000);
        }
        
        const now = Date.now();
        const timeLeft = Math.max(0, autoCancelTime - now);

        if (timeLeft > 0 && !timerRefs.current[order.id]) {
          const interval = setInterval(() => {
            setAsapTimers(prev => {
              const currentTimer = prev[order.id];
              if (!currentTimer) return prev;

              const newTimeLeft = Math.max(0, currentTimer.timeLeft - 1000);
              
              if (newTimeLeft === 0) {
                // Auto-cancel the order
                if (restaurantId) {
                  dispatch(autoCancelExpiredOrder({
                    orderId: order.id,
                    restaurantId
                  }));
                }
                // Clear timer from refs
                if (timerRefs.current[order.id]) {
                  clearInterval(timerRefs.current[order.id]);
                  delete timerRefs.current[order.id];
                }
                // Remove from state
                const newTimers = { ...prev };
                delete newTimers[order.id];
                return newTimers;
              }

              return {
                ...prev,
                [order.id]: {
                  ...currentTimer,
                  timeLeft: newTimeLeft
                }
              };
            });
          }, 1000);

          // Store interval in refs
          timerRefs.current[order.id] = interval;

          setAsapTimers(prev => ({
            ...prev,
            [order.id]: {
              timeLeft,
              interval
            }
          }));
        }
      }
    });

    // Cleanup timers for orders that are no longer pending ASAP
    Object.keys(timerRefs.current).forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (!order || order.status !== 'pending' || order.pickupOption !== 'asap') {
        clearInterval(timerRefs.current[orderId]);
        delete timerRefs.current[orderId];
        setAsapTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[orderId];
          return newTimers;
        });
      }
    });
  }, [orders, restaurantId, dispatch]);

  // Preparation timer management for accepted ASAP orders
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    // Start preparation timers for accepted ASAP orders with estimated pickup time
    orders.forEach(order => {
      if (order.pickupOption === 'asap' && order.status === 'confirmed' && order.estimatedPickupTime) {
        // Parse the estimated pickup time (e.g., "20-30 minutter" or "25 minutter")
        const timeMatch = order.estimatedPickupTime.match(/(\d+)/);
        if (timeMatch) {
          const prepTimeMinutes = parseInt(timeMatch[1]);
          const prepTimeMs = prepTimeMinutes * 60 * 1000;
          
          // Calculate when the order was accepted (use updatedAt if available, otherwise createdAt + some buffer)
          const acceptedTime = order.updatedAt ? new Date(order.updatedAt).getTime() : new Date(order.createdAt).getTime();
          const now = Date.now();
          const timeElapsed = now - acceptedTime;
          const timeLeft = Math.max(0, prepTimeMs - timeElapsed);

          if (timeLeft > 0 && !prepTimerRefs.current[order.id]) {
            const interval = setInterval(() => {
              setPreparationTimers(prev => {
                const currentTimer = prev[order.id];
                if (!currentTimer) return prev;

                const newTimeLeft = Math.max(0, currentTimer.timeLeft - 1000);
                
                if (newTimeLeft === 0) {
                  // Clear timer from refs
                  if (prepTimerRefs.current[order.id]) {
                    clearInterval(prepTimerRefs.current[order.id]);
                    delete prepTimerRefs.current[order.id];
                  }
                  // Remove from state
                  const newTimers = { ...prev };
                  delete newTimers[order.id];
                  return newTimers;
                }

                return {
                  ...prev,
                  [order.id]: {
                    ...currentTimer,
                    timeLeft: newTimeLeft
                  }
                };
              });
            }, 1000);

            // Store interval in refs
            prepTimerRefs.current[order.id] = interval;

            setPreparationTimers(prev => ({
              ...prev,
              [order.id]: {
                timeLeft,
                interval
              }
            }));
          }
        }
      }
    });

    // Cleanup preparation timers for orders that are no longer relevant
    Object.keys(prepTimerRefs.current).forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (!order || order.status !== 'confirmed' || !order.estimatedPickupTime) {
        clearInterval(prepTimerRefs.current[orderId]);
        delete prepTimerRefs.current[orderId];
        setPreparationTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[orderId];
          return newTimers;
        });
      }
    });
  }, [orders]);

  // Cleanup effect for timers
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(interval => {
        clearInterval(interval);
      });
      Object.values(prepTimerRefs.current).forEach(interval => {
        clearInterval(interval);
      });
      timerRefs.current = {};
      prepTimerRefs.current = {};
    };
  }, []);

  return {
    asapTimers,
    preparationTimers,
    clearAsapTimer: (orderId: string) => {
      if (timerRefs.current[orderId]) {
        clearInterval(timerRefs.current[orderId]);
        delete timerRefs.current[orderId];
        setAsapTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[orderId];
          return newTimers;
        });
      }
    }
  };
}

