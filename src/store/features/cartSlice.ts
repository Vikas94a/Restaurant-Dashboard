import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the cart item type
export interface CartItem {
  id: string;           // Unique identifier for the cart item
  itemName: string;     // Name of the menu item
  itemPrice: number;    // Price of the item
  quantity: number;     // Quantity in cart
  categoryName: string; // Category the item belongs to
  restaurantId: string; // ID of the restaurant
}

// Define the cart state type
export interface CartState {
  items: CartItem[];
  total: number;
}

// Load cart from localStorage or use initial state
const loadCartFromStorage = (): CartState => {
  if (typeof window !== 'undefined') {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }
  return {
    items: [],
    total: 0,
  };
};

// Initial state
const initialState: CartState = loadCartFromStorage();

// Helper function to save cart to localStorage
const saveCartToStorage = (state: CartState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart', JSON.stringify(state));
  }
};

// Create the cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      
      // Check if item already exists in cart
      const existingItemIndex = state.items.findIndex(
        item => item.id === newItem.id
      );

      if (existingItemIndex >= 0) {
        // If item exists, increase quantity
        state.items[existingItemIndex].quantity += newItem.quantity;
      } else {
        // If item doesn't exist, add it to cart
        state.items.push(newItem);
      }

      // Recalculate total
      state.total = state.items.reduce(
        (total, item) => total + (item.itemPrice * item.quantity),
        0
      );

      // Save to localStorage
      saveCartToStorage(state);
    },
    increaseQuantity: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingItem = state.items.find(item => item.id === itemId);
      if (existingItem) {
        existingItem.quantity += 1;
        state.total = state.items.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
        // Save to localStorage
        saveCartToStorage(state);
      }
    },
    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity -= 1;
        // Remove item if quantity drops to 0 or less
        if (state.items[existingItemIndex].quantity <= 0) {
          state.items.splice(existingItemIndex, 1);
        }
        state.total = state.items.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
        // Save to localStorage
        saveCartToStorage(state);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);
      if (existingItemIndex >= 0) {
        state.items.splice(existingItemIndex, 1);
        state.total = state.items.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
        // Save to localStorage
        saveCartToStorage(state);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }
    },
  },
});

// Export actions and reducer
export const { addToCart, increaseQuantity, decreaseQuantity, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer; 