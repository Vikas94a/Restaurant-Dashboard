export interface Feedback {
  orderId: string;
  restaurantId: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
}

export interface FeedbackFormData {
  rating: number;
  comment: string;
}

