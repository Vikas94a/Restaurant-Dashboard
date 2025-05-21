"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { CartItem as CartItemType } from '@/store/features/cartSlice'; // Import the CartItem type

interface CartItemProps {
  item: CartItemType;
  onIncreaseQuantity: () => void;
  onDecreaseQuantity: () => void;
  onRemoveItem: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex-1 pr-4">
        <h3 className="font-medium text-gray-800">{item.itemName}</h3>
        {/* Optional: Display category name if needed */}
        {/* <p className="text-sm text-gray-500">{item.categoryName}</p> */}
        <div className="flex items-center mt-2">
          <span className="text-primary font-semibold text-lg">
            ${(item.itemPrice * item.quantity).toFixed(2)}
          </span>
          {/* Quantity Controls */}
          <div className="flex items-center ml-auto border border-gray-300 rounded-md overflow-hidden">
            <button
              className="px-3 py-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={onDecreaseQuantity}
              disabled={item.quantity <= 1}
            >
              <FontAwesomeIcon icon={faMinus} className="w-3 h-3 text-gray-600" />
            </button>
            <span className="px-4 py-1 bg-gray-100 text-sm font-medium text-gray-800">
              {item.quantity}
            </span>
            <button
              className="px-3 py-1 hover:bg-gray-200 transition-colors"
              onClick={onIncreaseQuantity}
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      <button 
        className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
        onClick={onRemoveItem}
      >
        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CartItem; 