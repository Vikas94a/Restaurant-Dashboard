import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReceipt, faCreditCard, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { CartItem } from "@/types/cart";

interface OrderSummaryProps {
  cart: {
    items: CartItem[];
    total: number;
  };
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ cart }) => {
  // Calculate subtotal using item.totalPrice which includes base price + extras/add-ons
  // item.totalPrice is already calculated as: (basePrice + customizationPrice) * quantity
  const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const mva = subtotal * 0.15; // 15% MVA
  // Use cart.total (which is the sum of all item.totalPrice) as the source of truth
  // This ensures consistency with the cart state
  const total = cart.total || subtotal;

  return (
    <div className="space-y-4">
      {/* Order Items */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-orange-500 mr-2" />
          Your Items
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {cart.items.map((item: CartItem) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-800 truncate">{item.itemName}</h4>
                  <span className="text-sm text-gray-500 ml-2">x{item.quantity}</span>
                </div>
                
                {/* Customizations/Extras */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="space-y-1.5 mb-2 mt-2">
                    {item.customizations.map((customization) => (
                      <div key={customization.category} className="text-xs">
                        <span className="font-medium text-gray-700">{customization.category}:</span>
                        {customization.options.length === 0 ? (
                          <span className="text-gray-400 italic ml-1">Ingen</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {customization.options.map((option) => (
                              <span
                                key={option.id}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${
                                  option.price > 0
                                    ? 'bg-orange-100 text-orange-800 border-orange-300 font-medium'
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                              >
                                {option.name}
                                {option.price > 0 && (
                                  <span className="ml-1.5 font-semibold">+{option.price.toFixed(2)} kr</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Special Request */}
                {item.specialInstructions && item.specialInstructions.text && (
                  <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="font-medium text-blue-700">Special Request:</span>
                    <span className="ml-1 italic">{item.specialInstructions.text}</span>
                  </div>
                )}
              </div>
              
              <div className="text-right ml-3 flex-shrink-0">
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-gray-800">
                    {item.totalPrice.toFixed(2)} kr
                  </span>
                  {/* Show breakdown if there are extras with prices */}
                  {item.customizations && item.customizations.length > 0 && 
                   item.customizations.some(c => c.options.some(o => o.price > 0)) && (
                    <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                      <span className="text-gray-400">
                        {item.itemPrice * item.quantity} kr
                      </span>
                      <span className="mx-1 text-gray-400">+</span>
                      <span className="text-orange-600 font-medium">
                        {(item.totalPrice - (item.itemPrice * item.quantity)).toFixed(2)} kr
                      </span>
                      <span className="text-gray-400 ml-1">ekstra</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-orange-500 mr-2" />
          Price Breakdown
        </h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-800">{subtotal.toFixed(2)} kr</span>
          </div>
          
          <div className="flex justify-between text-sm items-center">
            <div className="flex items-center">
              <span className="text-gray-600">MVA (15%):</span>
              <FontAwesomeIcon 
                icon={faInfoCircle} 
                className="w-3 h-3 text-orange-500 ml-1 cursor-help" 
                title="MVA (Merverdiavgift) is the Norwegian VAT at 15%"
              />
            </div>
            <span className="font-medium text-gray-800">{mva.toFixed(2)} kr</span>
          </div>
          
          <div className="border-t border-orange-200 pt-2 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">Total:</span>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {total.toFixed(2)} kr
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4 text-orange-500 mr-2" />
          Payment Method
        </h3>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-800">Pay at Counter</p>
                <p className="text-xs text-green-600">Cash or card accepted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
