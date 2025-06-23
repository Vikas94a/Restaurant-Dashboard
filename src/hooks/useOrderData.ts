import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface OrderData {
  id: string;
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  status: string;
  total: number;
  createdAt: Date;
}

export function useOrderData(orderId: string | null) {
  const [data, setData] = useState<OrderData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderData() {
      if (!orderId) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
          throw new Error('Order not found');
        }

        const orderData = orderDoc.data();
        setData({
          id: orderDoc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
        } as OrderData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch order data'));
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderData();
  }, [orderId]);

  return { data, error, loading };
} 