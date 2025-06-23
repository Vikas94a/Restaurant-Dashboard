import { useState, useEffect } from 'react';
import { OrderStatus } from '@/types/order';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Order } from '@/types/checkout';

interface OrderStatusState {
  status: OrderStatus;
  estimatedTime: number | null;
}

interface OrderStatusProps {
  orderId: string;
}

export function useOrderStatus({ orderId }: OrderStatusProps) {
  const [orderStatus, setOrderStatus] = useState<OrderStatusState>({
    status: 'pending',
    estimatedTime: null
  });
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const updateOrderStatus = (newStatus: OrderStatus, estimatedTime?: number) => {
    setOrderStatus({
      status: newStatus,
      estimatedTime: estimatedTime || null
    });
  };

  useEffect(() => {
    if (!orderId) return;
    
    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOrderStatus({
          status: data.status,
          estimatedTime: data.estimatedTime || null
        });
        setPlacedOrder({ 
          id: doc.id,
          ...data
        } as Order);
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  return {
    orderStatus,
    showOrderStatus,
    setShowOrderStatus,
    placedOrder,
    updateOrderStatus
  };
}
