import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import { CartItem } from '@/types/cart';

// Define types for item customizations
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

// Define the cart state type
export interface CartState {
  items: CartItem[];
  total: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  restaurantId: string | null;
}

// Error messages for cart operations
const CART_ERROR_MESSAGES = {
  'storage-parse': 'Unable to load your saved cart. Starting with an empty cart.',
  'storage-save': 'Unable to save your cart changes. Please try again.',
  'storage-clear': 'Unable to clear your cart. Please try again.',
  'invalid-data': 'Your cart data is invalid. Starting with an empty cart.',
  'default': 'An unexpected error occurred with your cart.'
} as const;

// Helper function to get user-friendly error message
const getCartErrorMessage = (errorType: keyof typeof CART_ERROR_MESSAGES): string => {
  return CART_ERROR_MESSAGES[errorType] || CART_ERROR_MESSAGES.default;
};

// Load cart from localStorage or use initial state
const loadCartFromStorage = (): CartState => {
  if (typeof window !== 'undefined') {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        
        // Validate the parsed data structure
        if (!isValidCartState(parsedCart)) {
          toast.error(getCartErrorMessage('invalid-data'));
          return getInitialCartState();
        }
        
        return parsedCart;
      } catch (error) {
        toast.error(getCartErrorMessage('storage-parse'));
        return getInitialCartState();
      }
    }
  }
  return getInitialCartState();
};

// Helper function to validate cart state structure
interface CartItemValidation {
  id: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  categoryName: string;
  restaurantId: string;
  customizations: unknown[];
  totalPrice: number;
}

const isValidCartState = (data: unknown): data is CartState => {
  if (!data || typeof data !== 'object') return false;
  
  const cartData = data as Record<string, unknown>;
  
  if (!Array.isArray(cartData.items)) return false;
  if (typeof cartData.total !== 'number') return false;
  
  // Validate each cart item
  return cartData.items.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    
    const cartItem = item as CartItemValidation;
    
    return (
      typeof cartItem.id === 'string' &&
      typeof cartItem.itemName === 'string' &&
      typeof cartItem.itemPrice === 'number' &&
      typeof cartItem.quantity === 'number' &&
      typeof cartItem.categoryName === 'string' &&
      typeof cartItem.restaurantId === 'string' &&
      Array.isArray(cartItem.customizations) &&
      typeof cartItem.totalPrice === 'number'
    );
  });
};

// Helper function to get initial cart state
const getInitialCartState = (): CartState => ({
  items: [],
  total: 0,
  status: 'idle',
  error: null,
  restaurantId: null
});

// Initial state
const initialState: CartState = loadCartFromStorage();

// Helper function to save cart to localStorage
const saveCartToStorage = (state: CartState) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('cart', JSON.stringify(state));
    } catch (error) {
      toast.error(getCartErrorMessage('storage-save'));
    }
  }
};

// Helper function to clear cart from localStorage
const clearCartFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('cart');
    } catch (error) {
      toast.error(getCartErrorMessage('storage-clear'));
    }
  }
};

// Helper function to calculate item total price
const calculateItemTotal = (item: CartItem): number => {
  const basePrice = item.itemPrice;
  const customizationPrice = item.customizations.reduce((total, customization) => {
    return total + customization.options.reduce((optTotal, option) => optTotal + option.price, 0);
  }, 0);
  return (basePrice + customizationPrice) * item.quantity;
};

// Helper function to generate a stable hash from a string
const generateHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Helper function to sort and stringify customizations for consistent hashing
const stringifyCustomizations = (customizations: ItemCustomization[]): string => {
  return customizations
    .sort((a, b) => a.category.localeCompare(b.category))
    .map(customization => {
      const sortedOptions = [...customization.options]
        .sort((a, b) => a.id.localeCompare(b.id));
      return `${customization.category}:${sortedOptions.map(opt => `${opt.id}:${opt.price}`).join(',')}`;
    })
    .join('|');
};

// Helper function to generate unique cart item ID
const generateCartItemId = (item: Omit<CartItem, 'id' | 'totalPrice'>): string => {
  // Create a unique string representation of the item and its customizations
  const itemString = [
    item.restaurantId,
    item.itemName,
    stringifyCustomizations(item.customizations),
    item.specialInstructions?.text || '',
    item.specialInstructions?.timestamp || ''
  ].join('_');

  // Generate a hash of the string to create a compact, unique ID
  const hash = generateHash(itemString);
  
  // Prefix with a timestamp to ensure uniqueness even if items are added simultaneously
  const timestamp = Date.now().toString(36);
  
  return `${timestamp}-${hash}`;
};

// Helper function to find matching item in cart
const findMatchingItem = (items: CartItem[], newItem: Omit<CartItem, 'id' | 'totalPrice'>): number => {
  const newItemString = [
    newItem.restaurantId,
    newItem.itemName,
    stringifyCustomizations(newItem.customizations),
    newItem.specialInstructions?.text || '',
    newItem.specialInstructions?.timestamp || ''
  ].join('_');

  return items.findIndex(item => {
    const existingItemString = [
      item.restaurantId,
      item.itemName,
      stringifyCustomizations(item.customizations),
      item.specialInstructions?.text || '',
      item.specialInstructions?.timestamp || ''
    ].join('_');
    
    return existingItemString === newItemString;
  });
};

// Create the cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'id' | 'totalPrice'>>) => {
      const newItem = {
        ...action.payload,
        id: generateCartItemId(action.payload),
        totalPrice: calculateItemTotal(action.payload as CartItem)
      };
      
      // Check if item with same customizations exists in cart
      const existingItemIndex = findMatchingItem(state.items, action.payload);

      if (existingItemIndex >= 0) {
        // If item exists, increase quantity
        state.items[existingItemIndex].quantity += newItem.quantity;
        state.items[existingItemIndex].totalPrice = calculateItemTotal(state.items[existingItemIndex]);
      } else {
        // If item doesn't exist, add it to cart
        state.items.push(newItem);
      }

      // Recalculate total
      state.total = state.items.reduce(
        (total, item) => total + item.totalPrice,
        0
      );

      // Save to localStorage
      saveCartToStorage(state);
    },
    updateItemCustomizations: (state, action: PayloadAction<{ itemId: string; customizations: ItemCustomization[] }>) => {
      const { itemId, customizations } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        state.items[itemIndex].customizations = customizations;
        state.items[itemIndex].totalPrice = calculateItemTotal(state.items[itemIndex]);
        
        // Update total
        state.total = state.items.reduce(
          (total, item) => total + item.totalPrice,
          0
        );
        
        // Save to localStorage
        saveCartToStorage(state);
      }
    },
    updateSpecialInstructions: (state, action: PayloadAction<{ itemId: string; instructions: string }>) => {
      const { itemId, instructions } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        state.items[itemIndex].specialInstructions = {
          text: instructions,
          timestamp: Date.now()
        };
        
        // Save to localStorage
        saveCartToStorage(state);
      }
    },
    increaseQuantity: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingItem = state.items.find(item => item.id === itemId);
      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.totalPrice = calculateItemTotal(existingItem);
        state.total = state.items.reduce((total, item) => total + item.totalPrice, 0);
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
        } else {
          state.items[existingItemIndex].totalPrice = calculateItemTotal(state.items[existingItemIndex]);
        }
        state.total = state.items.reduce((total, item) => total + item.totalPrice, 0);
        saveCartToStorage(state);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);
      if (existingItemIndex >= 0) {
        state.items.splice(existingItemIndex, 1);
        state.total = state.items.reduce((total, item) => total + item.totalPrice, 0);
        saveCartToStorage(state);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      clearCartFromStorage();
    },
  },
});

// Export actions and reducer
export const { 
  addToCart, 
  increaseQuantity, 
  decreaseQuantity, 
  removeItem, 
  clearCart,
  updateItemCustomizations,
  updateSpecialInstructions
} = cartSlice.actions;
export default cartSlice.reducer; 