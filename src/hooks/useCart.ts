import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addToCart, increaseQuantity, decreaseQuantity, removeItem } from '@/store/features/cartSlice';
import { CartItem } from '@/types/cart';

export const useCart = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);

  const handleAddToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    try {
      // Generate a unique ID for the cart item
      const cartItemId = `${item.restaurantId}-${item.itemName}`;
      
      // Create the cart item with quantity 1 (if adding for the first time)
      const cartItem: CartItem = {
        ...item,
        id: cartItemId,
        quantity: 1,
      };

      // Dispatch the add to cart action
      dispatch(addToCart(cartItem));
      
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const handleIncreaseQuantity = (itemId: string) => {
    dispatch(increaseQuantity(itemId));
  };

  const handleDecreaseQuantity = (itemId: string) => {
    dispatch(decreaseQuantity(itemId));
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeItem(itemId));
  };

  return {
    cart,
    handleAddToCart,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleRemoveItem,
  };
}; 