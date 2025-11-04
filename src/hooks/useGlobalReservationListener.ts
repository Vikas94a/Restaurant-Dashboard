import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useSoundNotification } from '@/providers/SoundNotificationProvider';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Reservation } from '@/types/reservation';
import { toast } from 'sonner';

export const useGlobalReservationListener = () => {
  const { user, restaurantDetails } = useAppSelector((state) => state.auth);
  const { startRepeatingReservationSound, stopRepeatingReservationSound } = useSoundNotification();
  
  const previousReservationCountRef = useRef(0);
  const isInitializedRef = useRef(false);
  const previousReservationIdsRef = useRef<Set<string>>(new Set());

  // Listen for real-time reservation updates
  useEffect(() => {
    if (!restaurantDetails?.restaurantId) return;

    const reservationsRef = collection(db, 'restaurants', restaurantDetails.restaurantId, 'reservations');
    const q = query(reservationsRef, where('restaurantId', '==', restaurantDetails.restaurantId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status as string,
        } as Pick<Reservation, 'id' | 'status'> as Reservation;
      });

      // Check for new pending reservations
      const pendingReservations = reservationsData.filter(
        (reservation: Reservation) => (reservation.status as string) === 'pending'
      );

      // Get current pending reservation IDs
      const currentPendingReservationIds = new Set(pendingReservations.map(reservation => reservation.id));

      // If this is the first load, just set the initial state
      if (!isInitializedRef.current) {
        previousReservationCountRef.current = pendingReservations.length;
        previousReservationIdsRef.current = currentPendingReservationIds;
        isInitializedRef.current = true;
        return;
      }

      // Check if new pending reservations arrived
      const hasNewPendingReservations = pendingReservations.length > previousReservationCountRef.current;
      const hasNewReservationIds = pendingReservations.some(reservation => !previousReservationIdsRef.current.has(reservation.id));

      if ((hasNewPendingReservations || hasNewReservationIds) && pendingReservations.length > 0) {
        startRepeatingReservationSound();
        toast.success('📅 Ny reservasjon mottatt!', {
          duration: 4000,
          position: 'top-right',
        });
      }

      // Stop sound when no pending reservations
      if (pendingReservations.length === 0) {
        stopRepeatingReservationSound();
      }

      // Update previous state
      previousReservationCountRef.current = pendingReservations.length;
      previousReservationIdsRef.current = currentPendingReservationIds;
    }, (error) => {
      console.error('Error listening to reservations:', error);
    });

    return () => unsubscribe();
  }, [restaurantDetails?.restaurantId, startRepeatingReservationSound, stopRepeatingReservationSound]);

  return null;
};
