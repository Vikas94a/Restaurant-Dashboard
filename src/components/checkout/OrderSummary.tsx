import React from "react";
import { CustomerFormData } from "@/types/checkout";
import { CartItem } from "@/types/cart";

interface OrderSummaryProps {
  cart: {
    items: CartItem[];
    total: number;
  };
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  pickupOption: "asap" | "later";
  formData: CustomerFormData;
  isAsapAvailable: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cart,
  formData,
  isAsapAvailable,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-3">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Order Summary
      </h2>
      <div className="space-y-3 mb-5">
        {cart.items.map((item: CartItem) => (
          <div
            key={item.id}
            className="py-2 border-b border-gray-200 last:border-none"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="mr-2 text-gray-700 font-medium">{item.itemName}</span>
                <span className="text-gray-500 text-sm">x {item.quantity}</span>
              </div>
              <span className="text-gray-700 font-medium">
                {(item.itemPrice * item.quantity).toFixed(2)} kr 
              </span>
            </div>
            {/* Customizations/Extras */}
            {item.customizations && item.customizations.length > 0 && (
              <div className="ml-2 mt-1 text-xs text-gray-600 space-y-1">
                {item.customizations.map((customization) => (
                  <div key={customization.category} className="flex flex-wrap gap-1.5">
                    <span className="font-medium text-gray-700">{customization.category}:</span>
                    {customization.options.length === 0 ? (
                      <span className="text-gray-400 italic">None</span>
                    ) : (
                      customization.options.map((option) => (
                        <span
                          key={option.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
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
            {/* Special Request */}
            {item.specialInstructions && item.specialInstructions.text && (
              <div className="ml-2 mt-1 text-xs text-gray-700">
                <span className="font-medium">Special Request:</span> <span className="italic text-gray-600">{item.specialInstructions.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="py-3 border-t border-gray-200 font-semibold flex justify-between text-gray-800 uppercase">
        <span>Total</span>
        <span>{cart.total.toFixed(2)} kr</span>
      </div>

      {/* Payment Method */}
      <div className="mt-4">
        <h3 className="font-medium text-gray-700 mb-2">Payment Method</h3>
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 flex items-center justify-between">
          <div className="flex items-center">
            Pay at counter
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
