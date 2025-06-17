"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '@/hooks/useCart';
import CartItem from './Cart/CartItem';
import { useRouter } from 'next/navigation';
import { CartItem as CartItemType } from '@/types/cart';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Optional class name to apply to the cart overlay
   */
  className?: string;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const { cart, handleRemoveItem, handleIncreaseQuantity, handleDecreaseQuantity } = useCart();
  const router = useRouter();

  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) return;
    
    setIsNavigating(true);
    router.push('/checkout');
    onClose();
  };

  // Reset navigation state when cart opens
  useEffect(() => {
    if (isOpen) {
      setIsNavigating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
        <div 
        className={`fixed inset-0 z-40  transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          role="presentation"
          aria-label="Close cart"
        />

      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-lg z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Your Cart</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Close cart"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {isNavigating ? (
            <div className="flex items-center justify-center h-32">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-primary" />
            </div>
          ) : cart.items.length > 0 ? (
            <ul className="space-y-4">
              {cart.items.map((item: CartItemType) => (
                <li key={item.id}>
                  <CartItem
                    item={item}
                    onIncreaseQuantity={() => handleIncreaseQuantity(item.id)}
                    onDecreaseQuantity={() => handleDecreaseQuantity(item.id)}
                    onRemoveItem={() => handleRemoveItem(item.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <FontAwesomeIcon icon={faShoppingCart} className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg">Your cart is empty</p>
              <p className="text-sm mt-1">Add some items to get started</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center text-lg font-semibold mb-4">
            <span>Total:</span>
            <span className="text-xl text-primary">{cart.total.toFixed(2)} kr</span>
          </div>
          <button 
            onClick={handleProceedToCheckout}
            className={`w-full text-white py-3 px-4 rounded-md transition-all text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              ${cart.items.length === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
            `}
            disabled={cart.items.length === 0 || isNavigating}
            aria-disabled={cart.items.length === 0}
          >
            {isNavigating ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Proceed to Checkout'
            )}
          </button>
        </div>
      </div>
    </>
  );
} 