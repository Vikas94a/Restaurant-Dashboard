import { CartItem } from './cart';

export interface Order {
  id: string;
  restaurantId: string;
  customerDetails: CustomerFormData;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  pickupTime: string;
  pickupOption: 'asap' | 'later';
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  pickupTime: string;
}

export interface RestaurantHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface RestaurantDetails {
  restaurantId: string;
  openingHours?: RestaurantHours[];
  name?: string;
}
