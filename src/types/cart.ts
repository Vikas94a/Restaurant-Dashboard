export interface ItemOption {
  id: string;
  name: string;
  price: number;
  category: string; // e.g., 'size', 'toppings', 'extras'
}

export interface ItemCustomization {
  category: string;      // e.g., 'size', 'toppings', 'extras'
  options: ItemOption[]; // Selected options for this category
}

export interface SpecialInstructions {
  text: string;
  timestamp: number;
}

export interface CartItem {
  id: string;
  restaurantId: string;
  itemName: string;
  itemPrice: number;
  categoryName: string;
  customizations: ItemCustomization[];
  specialInstructions?: SpecialInstructions;
  totalPrice: number;
  quantity: number;
  // Additional fields for checkout
  itemId?: string;  // Reference to the original menu item
  imageUrl?: string;
  dietaryTags?: string[];
}

export interface Cart {
  items: CartItem[];
  total: number;
} 