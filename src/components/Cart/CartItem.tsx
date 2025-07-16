"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { CartItem as CartItemType } from '@/types/cart';

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
    <div className="group flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl shadow-md border border-orange-50 hover:shadow-lg transition-all duration-300 transform hover:scale-102">
      <div className="flex-1 pr-2 sm:pr-3">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-gray-700 text-base sm:text-lg">{item.itemName}</h3>
          <button 
            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-400 hover:bg-red-25 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            onClick={onRemoveItem}
          >
            <FontAwesomeIcon icon={faTrash} className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Show customizations/extras if any */}
        {item.customizations && item.customizations.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            {item.customizations.map((customization) => (
              <div key={customization.category} className="flex flex-wrap gap-1">
                <span className="font-semibold text-orange-500">{customization.category}:</span>
                {customization.options.length === 0 ? (
                  <span className="text-gray-400 italic">None</span>
                ) : (
                  customization.options.map((option) => (
                    <span 
                      key={option.id} 
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-orange-50 to-red-50 text-orange-600 font-medium border border-orange-100"
                    >
                      {option.name}
                      {option.price > 0 && (
                        <span className="text-orange-500 ml-1 font-bold">+{option.price.toFixed(2)} kr</span>
                      )}
                    </span>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show special request if any */}
        {item.specialInstructions && (
          <div className="mt-2 text-xs">
            <span className="font-semibold text-orange-500">Special Request: </span>
            <span className="text-gray-500 italic">{item.specialInstructions.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-3">
          <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent font-bold text-base sm:text-lg">
            {(item.itemPrice * item.quantity).toFixed(2)} kr
          </span>
          
          {/* Quantity Controls */}
          <div className="flex items-center justify-center sm:justify-end space-x-1">
            <button
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-orange-100 hover:bg-orange-25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              onClick={onDecreaseQuantity}
              disabled={item.quantity <= 1}
            >
              <FontAwesomeIcon icon={faMinus} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
            </button>
            <span className="w-7 sm:w-8 text-center font-bold text-gray-700 text-sm sm:text-base">
              {item.quantity}
            </span>
            <button
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-orange-100 hover:bg-orange-25 transition-all duration-200"
              onClick={onIncreaseQuantity}
            >
              <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem; 