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
  ReservationConflict,
  ReservationStatus
} from '@/types/reservation';
import { sendReservationConfirmationEmail } from './email/emailService';

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
    
    try {
      const settings = await this.getReservationSettings(restaurantId);
      
      if (!settings || !settings.enabled) {
        return {
          date,
          timeSlots: [],
          isAvailable: false
        };
      }

      // Get existing reservations for the date from restaurant subcollection
      let existingReservations: Reservation[] = [];
      
      try {
        const reservationsRef = collection(db, 'restaurants', restaurantId, 'reservations');
        const reservationsQuery = query(
          reservationsRef,
          where('reservationDetails.date', '==', date),
          where('status', 'in', ['pending', 'confirmed'])
        );
        
        const reservationsSnapshot = await getDocs(reservationsQuery);
        existingReservations = reservationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Reservation));
      } catch (reservationError) {
        // If there's an error reading reservations (e.g., subcollection doesn't exist yet),
        // just continue with empty reservations array
        existingReservations = [];
      }

      // Generate time slots
      const timeSlots = this.generateTimeSlots(settings, existingReservations);

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
    const slots: TimeSlot[] = [];
    const { timeSlotInterval, maxReservationsPerTimeSlot } = settings;
    
    // For now, return empty slots since we're using restaurant timing logic
    // This method is kept for compatibility but the actual time slot generation
    // is now handled by the restaurant timing hooks
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

      const docRef = await addDoc(collection(db, 'restaurants', request.restaurantId, 'reservations'), reservationData);
      
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

      // Check if time slot is available using restaurant timing logic
      const isTimeSlotValid = await this.validateTimeSlotWithRestaurantHours(
        request.restaurantId, 
        request.reservationDetails.date, 
        request.reservationDetails.time
      );
      
      if (!isTimeSlotValid) {
        return {
          type: 'time_conflict',
          message: 'This time slot is not available.',
          suggestedAlternatives: []
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
      const reservationsRef = collection(db, 'restaurants', restaurantId, 'reservations');
      let reservationsQuery = query(
        reservationsRef,
        orderBy('reservationDetails.date', 'desc')
      );
      
      if (status) {
        reservationsQuery = query(
          reservationsRef,
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
      // If there's an error (e.g., subcollection doesn't exist yet), return empty array
      console.log('No reservations subcollection found yet, returning empty array');
      return [];
    }
  }

  // Update reservation status
  static async updateReservationStatus(
    restaurantId: string,
    reservationId: string, 
    status: ReservationStatus,
    notes?: string
  ): Promise<void> {
    try {
      const reservationRef = doc(db, 'restaurants', restaurantId, 'reservations', reservationId);
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

      // Send confirmation email when reservation is confirmed
      if (status === 'confirmed') {
        try {
          const reservation = await this.getReservationById(restaurantId, reservationId);
          if (reservation) {
            await sendReservationConfirmationEmail(reservation);
            console.log('Reservation confirmation email sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't throw the error - reservation status update should still succeed
        }
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      throw new Error('Failed to update reservation status');
    }
  }

  // Get reservation by ID
  static async getReservationById(restaurantId: string, reservationId: string): Promise<Reservation | null> {
    try {
      const reservationRef = doc(db, 'restaurants', restaurantId, 'reservations', reservationId);
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

  // Validate time slot using restaurant timing logic
  private static async validateTimeSlotWithRestaurantHours(
    restaurantId: string,
    date: string,
    time: string
  ): Promise<boolean> {
    try {
      // Get restaurant details to access opening hours
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const restaurantDoc = await getDoc(restaurantRef);
      
      if (!restaurantDoc.exists()) {
        return false;
      }
      
      const restaurantData = restaurantDoc.data();
      const openingHours = restaurantData.openingHours || [];
      
      if (openingHours.length === 0) {
        return false;
      }
      
      // Check if the date is open
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Find matching day in opening hours
      const dayHours = openingHours.find((hour: any) => {
        const normalizedDay = hour.day.toLowerCase().trim();
        const normalizedCurrentDay = dayOfWeek.toLowerCase().trim();
        
        // Handle common variations
        const dayMappings: { [key: string]: string } = {
          'monday': 'monday', 'mon': 'monday', 'm': 'monday',
          'tuesday': 'tuesday', 'tue': 'tuesday', 'tues': 'tuesday', 't': 'tuesday',
          'wednesday': 'wednesday', 'wed': 'wednesday', 'w': 'wednesday',
          'thursday': 'thursday', 'thu': 'thursday', 'thurs': 'thursday', 'th': 'thursday',
          'friday': 'friday', 'fri': 'friday', 'f': 'friday',
          'saturday': 'saturday', 'sat': 'saturday', 's': 'saturday',
          'sunday': 'sunday', 'sun': 'sunday', 'su': 'sunday',
          'mandag': 'monday', 'tirsdag': 'tuesday', 'onsdag': 'wednesday',
          'torsdag': 'thursday', 'fredag': 'friday', 'lørdag': 'saturday', 'søndag': 'sunday'
        };
        
        const mappedDay = dayMappings[normalizedDay] || normalizedDay;
        const mappedCurrentDay = dayMappings[normalizedCurrentDay] || normalizedCurrentDay;
        
        return mappedDay === mappedCurrentDay;
      });
      
      if (!dayHours || dayHours.closed) {
        return false;
      }
      
      // Check if time is within opening hours
      const [openHour, openMinute] = dayHours.open.split(':').map(Number);
      const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
      
      // Parse the selected time
      const [timeStr, period] = time.replace(/\s/g, '').split(/(AM|PM)/i);
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      let selectedHour = hours;
      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        selectedHour += 12;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        selectedHour = 0;
      }
      
      // Check if time is within opening hours
      const openingMinutes = openHour * 60 + openMinute;
      const closingMinutes = closeHour * 60 + closeMinute;
      const selectedMinutes = selectedHour * 60 + minutes;
      
      if (selectedMinutes < openingMinutes || selectedMinutes >= closingMinutes) {
        return false;
      }
      
      // If it's today, check if time is not in the past
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);
      
      if (dateObj.getTime() === today.getTime()) {
        const selectedDateTime = new Date(now);
        selectedDateTime.setHours(selectedHour, minutes, 0, 0);
        
        const minimumTime = new Date(now);
        minimumTime.setMinutes(minimumTime.getMinutes() + 30); // 30 minutes buffer
        
        if (selectedDateTime < minimumTime) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating time slot:', error);
      return false;
    }
  }
}
