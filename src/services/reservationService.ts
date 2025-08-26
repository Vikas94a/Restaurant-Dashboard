import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Reservation, 
  ReservationSettings, 
  CreateReservationRequest, 
  AvailabilityResponse,
  TimeSlot,
  ReservationConflict 
} from '@/types/reservation';

export class ReservationService {
    // Get restaurant reservation settings
  static async getReservationSettings(restaurantId: string): Promise<ReservationSettings | null> {
    console.log('Getting reservation settings for restaurant:', restaurantId);
    
    try {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const restaurantDoc = await getDoc(restaurantRef);
      
      if (restaurantDoc.exists()) {
        const data = restaurantDoc.data();
        console.log('Restaurant data:', data);
        const settings = data.reservationSettings || null;
        console.log('Reservation settings found:', settings);
        return settings;
      }
      console.log('Restaurant document does not exist');
      return null;
    } catch (error) {
      console.error('Error fetching reservation settings:', error);
      throw new Error('Failed to fetch reservation settings');
    }
  }

  // Check availability for a specific date
  static async checkAvailability(
    restaurantId: string, 
    date: string
  ): Promise<AvailabilityResponse> {
    console.log('ReservationService.checkAvailability called with:', { restaurantId, date });
    
    try {
      const settings = await this.getReservationSettings(restaurantId);
      console.log('Reservation settings loaded:', settings);
      
      if (!settings || !settings.enabled) {
        console.log('Reservations not enabled or no settings found');
        return {
          date,
          timeSlots: [],
          isAvailable: false
        };
      }

      // Get existing reservations for the date
      let existingReservations: Reservation[] = [];
      
      try {
        console.log('Querying reservations collection...');
        const reservationsRef = collection(db, 'reservations');
        const reservationsQuery = query(
          reservationsRef,
          where('restaurantId', '==', restaurantId),
          where('reservationDetails.date', '==', date),
          where('status', 'in', ['pending', 'confirmed'])
        );
        
        console.log('Executing reservations query...');
        const reservationsSnapshot = await getDocs(reservationsQuery);
        existingReservations = reservationsSnapshot.docs.map(doc => doc.data() as Reservation);
        console.log('Found existing reservations:', existingReservations.length);
      } catch (reservationError) {
        // If there's an error reading reservations (e.g., collection doesn't exist yet),
        // just continue with empty reservations array
        console.log('Error reading reservations, continuing with empty array:', reservationError);
        existingReservations = [];
      }

      // Generate time slots
      console.log('Generating time slots with settings:', settings);
      const timeSlots = this.generateTimeSlots(settings, existingReservations);
      console.log('Generated time slots:', timeSlots);

      return {
        date,
        timeSlots,
        isAvailable: timeSlots.some(slot => slot.available)
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  // Generate available time slots
  private static generateTimeSlots(
    settings: ReservationSettings, 
    existingReservations: Reservation[]
  ): TimeSlot[] {
    console.log('generateTimeSlots called with:', { settings, existingReservationsCount: existingReservations.length });
    
    const slots: TimeSlot[] = [];
    const { openingTime, closingTime, timeSlotInterval, maxReservationsPerTimeSlot } = settings;
    
    console.log('Time settings:', { openingTime, closingTime, timeSlotInterval, maxReservationsPerTimeSlot });
    
    // Convert times to minutes for easier calculation
    const openingMinutes = this.timeToMinutes(openingTime);
    const closingMinutes = this.timeToMinutes(closingTime);
    
    console.log('Time in minutes:', { openingMinutes, closingMinutes });
    
    // Generate slots every timeSlotInterval minutes
    for (let time = openingMinutes; time < closingMinutes; time += timeSlotInterval) {
      const timeString = this.minutesToTime(time);
      
      // Count existing reservations for this time slot
      const currentBookings = existingReservations.filter(
        res => res.reservationDetails.time === timeString
      ).length;
      
      slots.push({
        time: timeString,
        available: currentBookings < maxReservationsPerTimeSlot,
        currentBookings,
        maxBookings: maxReservationsPerTimeSlot
      });
    }
    
    console.log('Generated slots:', slots);
    return slots;
  }

  // Convert time string (HH:MM) to minutes
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Convert minutes to time string (HH:MM)
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Create a new reservation
  static async createReservation(
    request: CreateReservationRequest
  ): Promise<Reservation> {
    try {
      // Check for conflicts
      const conflict = await this.checkReservationConflict(request);
      if (conflict) {
        throw new Error(conflict.message);
      }

      const reservationData: Omit<Reservation, 'id'> = {
        restaurantId: request.restaurantId,
        domain: request.domain,
        customerDetails: request.customerDetails,
        reservationDetails: {
          ...request.reservationDetails,
          duration: 90 // Default 90 minutes
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'reservations'), reservationData);
      
      return {
        id: docRef.id,
        ...reservationData
      };
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  // Check for reservation conflicts
  private static async checkReservationConflict(
    request: CreateReservationRequest
  ): Promise<ReservationConflict | null> {
    try {
      const settings = await this.getReservationSettings(request.restaurantId);
      if (!settings || !settings.enabled) {
        return {
          type: 'restaurant_closed',
          message: 'Reservations are not currently available at this restaurant.'
        };
      }

      // Check advance booking limit
      const requestedDate = new Date(request.reservationDetails.date);
      const today = new Date();
      const daysDiff = Math.ceil((requestedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > settings.advanceBookingDays) {
        return {
          type: 'advance_booking_limit',
          message: `Reservations can only be made up to ${settings.advanceBookingDays} days in advance.`
        };
      }

      // Check party size limits
      if (request.reservationDetails.partySize < settings.minPartySize || 
          request.reservationDetails.partySize > settings.maxPartySize) {
        return {
          type: 'capacity_exceeded',
          message: `Party size must be between ${settings.minPartySize} and ${settings.maxPartySize} people.`
        };
      }

      // Check if time slot is available
      const availability = await this.checkAvailability(request.restaurantId, request.reservationDetails.date);
      const timeSlot = availability.timeSlots.find(slot => slot.time === request.reservationDetails.time);
      
      if (!timeSlot || !timeSlot.available) {
        return {
          type: 'time_conflict',
          message: 'This time slot is not available.',
          suggestedAlternatives: availability.timeSlots
            .filter(slot => slot.available)
            .slice(0, 3)
            .map(slot => ({
              date: request.reservationDetails.date,
              time: slot.time
            }))
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking reservation conflict:', error);
      return {
        type: 'time_conflict',
        message: 'Unable to verify availability. Please try again.'
      };
    }
  }

  // Get restaurant reservations
  static async getRestaurantReservations(
    restaurantId: string, 
    status?: ReservationStatus
  ): Promise<Reservation[]> {
    try {
      const reservationsRef = collection(db, 'reservations');
      let reservationsQuery = query(
        reservationsRef,
        where('restaurantId', '==', restaurantId),
        orderBy('reservationDetails.date', 'desc')
      );
      
      if (status) {
        reservationsQuery = query(
          reservationsRef,
          where('restaurantId', '==', restaurantId),
          where('status', '==', status),
          orderBy('reservationDetails.date', 'desc')
        );
      }
      
      const snapshot = await getDocs(reservationsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
    } catch (error) {
      // If there's an error (e.g., collection doesn't exist yet), return empty array
      console.log('No reservations collection found yet, returning empty array');
      return [];
    }
  }

  // Update reservation status
  static async updateReservationStatus(
    reservationId: string, 
    status: ReservationStatus,
    notes?: string
  ): Promise<void> {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      const updateData: Partial<Reservation> = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (status === 'confirmed') {
        updateData.confirmedAt = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelledAt = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(reservationRef, updateData);
    } catch (error) {
      console.error('Error updating reservation status:', error);
      throw new Error('Failed to update reservation status');
    }
  }

  // Get reservation by ID
  static async getReservationById(reservationId: string): Promise<Reservation | null> {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      const reservationDoc = await getDoc(reservationRef);
      
      if (reservationDoc.exists()) {
        return {
          id: reservationDoc.id,
          ...reservationDoc.data()
        } as Reservation;
      }
      return null;
    } catch (error) {
      console.error('Error fetching reservation:', error);
      throw new Error('Failed to fetch reservation');
    }
  }
}
