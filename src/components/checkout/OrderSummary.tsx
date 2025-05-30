import React from "react";
import { CartItem, CustomerFormData } from "@/types/checkout";

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
  handleSubmit,
  pickupOption,
  formData,
  isAsapAvailable,
}) => {
  return (
    <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Order Summary
      </h2>
      <div className="space-y-4">
        {cart.items.map((item: CartItem) => (
          <div key={item.id} className="flex justify-between items-center">
            <span>
              {item.itemName} x {item.quantity}
            </span>
            <span>${(item.itemPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 font-semibold flex justify-between">
        <span>Total</span>
        <span>${cart.total.toFixed(2)}</span>
      </div>

      {/* Payment Method */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-700 mb-2">Payment Method</h3>
        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
          Pay at counter
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        onClick={handleSubmit}
        className="mt-6 w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
        disabled={formData.pickupTime === ""}
      >
        Place Order
      </button>
    </div>
  );
};

export default OrderSummary;
