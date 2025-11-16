/**
 * Menu feature type definitions
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

export interface MenuItemFormData {
  id?: string;
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  imageUrl?: string;
  isPopular?: boolean;
  dietaryTags?: string[];
  availability?: AvailabilityState;
  customizations?: any[];
  linkedReusableExtraIds?: string[];
}

