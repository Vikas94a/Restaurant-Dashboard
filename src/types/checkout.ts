export interface Order {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  estimatedPickupTime?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  pickupTime: string;
  restaurantId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CartItem {
  id: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  restaurantId: string;
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
