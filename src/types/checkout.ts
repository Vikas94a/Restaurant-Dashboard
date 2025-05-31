import { CartItem } from './cart';

export interface Order {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  estimatedPickupTime?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CartItem[];
  total: number;
  pickupTime: string;
  restaurantId: string;
  createdAt?: any;
  updatedAt?: any;
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
}
