export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

export interface Reservation {
  id: string;
  restaurantId: string;
  domain: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
  reservationDetails: {
    date: string; // ISO date string
    time: string; // HH:MM format
    partySize: number;
    duration: number; // in minutes, default 90
  };
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  notes?: string;
  tableAssignment?: string;
}

export interface ReservationSettings {
  enabled: boolean;
  maxPartySize: number;
  minPartySize: number;
  advanceBookingDays: number;
  reservationLink: string;
  reservationDuration: number; // in minutes
  maxReservationsPerTimeSlot: number;
  timeSlotInterval: number; // in minutes
  blackoutDates?: string[]; // ISO date strings
  specialHours?: {
    [date: string]: {
      openingTime: string;
      closingTime: string;
    };
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
  currentBookings: number;
  maxBookings: number;
}

export interface AvailabilityResponse {
  date: string;
  timeSlots: TimeSlot[];
  isAvailable: boolean;
}

export interface CreateReservationRequest {
  restaurantId: string;
  domain: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
  reservationDetails: {
    date: string;
    time: string;
    partySize: number;
  };
}

export interface ReservationConflict {
  type: 'time_conflict' | 'capacity_exceeded' | 'restaurant_closed' | 'advance_booking_limit';
  message: string;
  suggestedAlternatives?: {
    date: string;
    time: string;
  }[];
}
