import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RestaurantData {
  id: string;
  name: string;
  operatingHours: Record<number, {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }>;
}

export function useRestaurantData(restaurantId: string | null) {
  const [data, setData] = useState<RestaurantData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurantData() {
      if (!restaurantId) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        const restaurantRef = doc(db, 'restaurants', restaurantId);
        const restaurantDoc = await getDoc(restaurantRef);

        if (!restaurantDoc.exists()) {
          throw new Error('Restaurant not found');
        }

        setData({
          id: restaurantDoc.id,
          ...restaurantDoc.data(),
        } as RestaurantData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch restaurant data'));
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurantData();
  }, [restaurantId]);

  return { data, error, loading };
} 