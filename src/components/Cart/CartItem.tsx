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
    <div className="group flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex-1 pr-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-800 text-lg">{item.itemName}</h3>
          <button 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            onClick={onRemoveItem}
          >
            <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
          </button>
        </div>

        {/* Show customizations/extras if any */}
        {item.customizations && item.customizations.length > 0 && (
          <div className="mt-2 text-sm text-gray-600 space-y-1.5">
            {item.customizations.map((customization) => (
              <div key={customization.category} className="flex flex-wrap gap-1.5">
                <span className="font-medium text-gray-700">{customization.category}:</span>
                {customization.options.length === 0 ? (
                  <span className="text-gray-400 italic">None</span>
                ) : (
                  customization.options.map((option) => (
                    <span 
                      key={option.id} 
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {option.name}
                      {option.price > 0 && (
                        <span className="text-primary ml-1 font-medium">+{option.price.toFixed(2)} kr</span>
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
          <div className="mt-2 text-sm">
            <span className="font-medium text-gray-700">Special Request: </span>
            <span className="text-gray-600 italic">{item.specialInstructions.text}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-primary font-bold text-lg">
            {(item.itemPrice * item.quantity).toFixed(2)} kr
          </span>
          
          {/* Quantity Controls */}
          <div className="flex items-center space-x-1">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              onClick={onDecreaseQuantity}
              disabled={item.quantity <= 1}
            >
              <FontAwesomeIcon icon={faMinus} className="w-3 h-3 text-gray-600" />
            </button>
            <span className="w-8 text-center font-medium text-gray-800">
              {item.quantity}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-all duration-200"
              onClick={onIncreaseQuantity}
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem; 