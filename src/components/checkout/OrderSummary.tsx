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
  // Calculate MVA (VAT) - 15% of subtotal
  const subtotal = cart.items.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  const mva = subtotal * 0.15; // 15% MVA
  const total = subtotal + mva;

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
                  <div className="space-y-1 mb-2">
                    {item.customizations.map((customization) => (
                      <div key={customization.category} className="text-xs">
                        <span className="font-medium text-orange-600">{customization.category}:</span>
                        {customization.options.length === 0 ? (
                          <span className="text-gray-400 italic ml-1">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {customization.options.map((option) => (
                              <span
                                key={option.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs border border-orange-200"
                              >
                                {option.name}
                                {option.price > 0 && (
                                  <span className="ml-1 font-medium">+{option.price.toFixed(2)} kr</span>
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
              
              <div className="text-right ml-3">
                <span className="font-semibold text-gray-800">
                  {(item.itemPrice * item.quantity).toFixed(2)} kr
                </span>
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

      {/* Order Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start">
          <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Order Information</p>
            <ul className="space-y-1 text-xs">
              <li>• Orders are prepared fresh when you arrive</li>
              <li>• Please bring your order confirmation</li>
              <li>• Payment is due at pickup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
