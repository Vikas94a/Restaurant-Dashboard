"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '@/hooks/useCart';
import CartItem from './Cart/CartItem';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) return;
    
    setIsNavigating(true);
    
    // Extract domain from current pathname
    const pathSegments = pathname.split('/');
    const domain = pathSegments[1]; // First segment after the root
    
    if (domain && domain !== 'restaurant' && domain !== 'checkout' && domain !== 'dashboard') {
      // Use domain-based routing
      router.push(`/${domain}/checkout`);
    } else {
      // Fallback to old routing
      router.push('/checkout');
    }
    
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
        className={`fixed inset-y-0 right-0 w-full max-w-sm sm:max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-orange-50 bg-gradient-to-r from-orange-25 to-red-25">
          <h2 className="text-lg sm:text-xl font-bold text-gray-700">Your Cart</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-orange-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
            aria-label="Close cart"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {isNavigating ? (
            <div className="flex items-center justify-center h-24">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-orange-400" />
            </div>
          ) : cart.items.length > 0 ? (
            <ul className="space-y-3">
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
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-full mb-3">
                <FontAwesomeIcon icon={faShoppingCart} className="w-12 h-12 text-orange-300" />
              </div>
              <p className="text-lg font-semibold text-gray-600">Your cart is empty</p>
              <p className="text-gray-500 mt-1 text-sm">Add some delicious items to get started!</p>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-orange-50 bg-gradient-to-r from-orange-25 to-red-25">
          <div className="flex justify-between items-center text-base sm:text-lg font-bold mb-3 sm:mb-4">
            <span className="text-gray-700">Total:</span>
            <span className="text-lg sm:text-xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{cart.total.toFixed(2)} kr</span>
          </div>
          <button 
            onClick={handleProceedToCheckout}
            className={`w-full text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-opacity-50 shadow-md
              ${cart.items.length === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 focus:ring-orange-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}
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