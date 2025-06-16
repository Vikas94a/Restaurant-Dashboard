export interface OrderItem {
  itemName: string;
  quantity: number;
  price: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  items: OrderItem[];
  customerDetails: CustomerDetails;
  pickupTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  feedbackEmailSent?: boolean;
  feedbackSubmitted?: boolean;
} 