/**
 * Availability state types and utilities
 */

export type AvailabilityStatus = 
  | 'available'
  | 'unavailable_today'
  | 'unavailable_indefinite'
  | 'unavailable_until';

export interface AvailabilityState {
  status: AvailabilityStatus;
  until: string | null; // ISO timestamp for 'unavailable_until'
}

/**
 * Check if an item is currently available based on its availability state
 */
export function isItemAvailable(availability: AvailabilityState): boolean {
  if (availability.status === 'available') {
    return true;
  }
  
  if (availability.status === 'unavailable_indefinite') {
    return false;
  }
  
  if (availability.status === 'unavailable_today') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if we're still in today (before midnight)
    return now >= tomorrow;
  }
  
  if (availability.status === 'unavailable_until' && availability.until) {
    const untilDate = new Date(availability.until);
    const now = new Date();
    return now >= untilDate;
  }
  
  return false;
}

/**
 * Get human-readable label for availability status
 */
export function getAvailabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case 'available':
      return 'Tilgjengelig';
    case 'unavailable_today':
      return 'Utilgjengelig i dag';
    case 'unavailable_indefinite':
      return 'Utilgjengelig';
    case 'unavailable_until':
      return 'Utilgjengelig til';
    default:
      return 'Ukjent status';
  }
}

/**
 * Convert legacy isAvailable boolean to AvailabilityState
 */
export function fromLegacyAvailability(isAvailable: boolean): AvailabilityState {
  return {
    status: isAvailable ? 'available' : 'unavailable_indefinite',
    until: null,
  };
}




