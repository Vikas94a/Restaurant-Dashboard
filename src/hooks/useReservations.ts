import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { ReservationService } from '@/services/reservationService';
import { Reservation, ReservationStatus } from '@/types/reservation';

export function useReservations(status?: ReservationStatus) {
  const { restaurantDetails } = useAppSelector((state) => state.auth);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantDetails?.restaurantId) {
      loadReservations();
    }
  }, [restaurantDetails, status]);

  const loadReservations = async () => {
    if (!restaurantDetails?.restaurantId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await ReservationService.getRestaurantReservations(
        restaurantDetails.restaurantId,
        status
      );
      setReservations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reservations';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReservationStatus = async (
    reservationId: string, 
    newStatus: ReservationStatus, 
    notes?: string
  ) => {
    try {
      await ReservationService.updateReservationStatus(reservationId, newStatus, notes);
      // Reload reservations after update
      await loadReservations();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reservation';
      setError(errorMessage);
      return false;
    }
  };

  const refreshReservations = () => {
    loadReservations();
  };

  return {
    reservations,
    isLoading,
    error,
    updateReservationStatus,
    refreshReservations
  };
}
