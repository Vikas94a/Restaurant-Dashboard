import { CartItem } from './cart';
import { CustomerFormData } from './checkout';

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  restaurantId: string;
  customerDetails: CustomerFormData;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  pickupTime: string;
  pickupOption: 'asap' | 'later';
  estimatedPickupTime: string | null;
}

export interface OrderItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  restaurantId: string;
} 