import React from 'react';
import { Order } from '@/types/checkout';
import { CartItem as OrderItem } from '@/types/cart';

type BackendOrderStatus = 'accepted' | 'rejected' | 'completed';

interface OrderListProps {
  orders: Order[];
  estimatedTimes: Record<string, string>;
  onEstimatedTimeChange: (orderId: string, time: string) => void;
  onStatusChange: (orderId: string, status: BackendOrderStatus) => void;
}

// Move OrderCard here from the page file
interface OrderCardProps {
  order: Order;
  estimatedTime: string;
  onEstimatedTimeChange: (orderId: string, time: string) => void;
  onStatusChange: (orderId: string, status: BackendOrderStatus) => void;
}

function OrderCard({
  order,
  estimatedTime,
  onEstimatedTimeChange,
  onStatusChange,
}: OrderCardProps): React.ReactElement {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100/50",
    confirmed: "bg-green-50 border-green-200 hover:bg-green-100/50",
    cancelled: "bg-red-50 border-red-200 hover:bg-red-100/50",
    completed: "bg-blue-50 border-blue-200 hover:bg-blue-100/50",
    ready: "bg-blue-50 border-blue-200 hover:bg-blue-100/50",
  };

  // Map backend status to UI status
  const backendToUIStatus = (status: string) => {
    if (status === 'accepted') return 'confirmed';
    if (status === 'rejected') return 'cancelled';
    return status;
  };
  // Map UI status to backend status
  const uiToBackendStatus = (status: string): BackendOrderStatus => {
    if (status === 'confirmed') return 'accepted';
    if (status === 'cancelled') return 'rejected';
    return 'completed';
  };

  const uiStatus = backendToUIStatus(order.status);
  const isAsapOrder = order.pickupOption === 'asap';

  const formatPickupTime = () => {
    if (isAsapOrder) return 'ASAP';
    const pickupDate = new Date(order.customerDetails.pickupDate);
    const today = new Date();
    const isToday = pickupDate.toDateString() === today.toDateString();
    if (isToday) {
      return `Today at ${order.pickupTime}`;
    } else {
      const day = pickupDate.getDate();
      const weekday = pickupDate.toLocaleDateString('en-US', { weekday: 'long' });
      return `${day} ${weekday} at ${order.pickupTime}`;
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-200 ${statusColors[uiStatus]}`}
    >
      {/* Order Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            #{order.id.slice(-6)}
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                uiStatus === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : uiStatus === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : uiStatus === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {uiStatus.charAt(0).toUpperCase() + uiStatus.slice(1)}
            </span>
          </h3>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-2">Name:</span>
              {order.customerDetails?.name}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-2">Phone:</span>
              {order.customerDetails?.phone}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-2">Email:</span>
              {order.customerDetails?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <div className="bg-white/50 rounded-md p-3 space-y-2">
          {order.items.map((item: OrderItem, i: number) => (
            <div key={i} className="py-2 border-b border-gray-100 last:border-none">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700 flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded mr-2">
                    {item.quantity}x
                  </span>
                  {item.itemName}
                </span>
                <span className="text-gray-900 font-medium">
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
          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-semibold text-gray-900">
              {order.total.toFixed(2)} kr
            </span>
          </div>
        </div>
      </div>

      {/* Pickup Time */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-gray-600 flex items-center">
          {/* You may want to import FontAwesomeIcon and faClock if needed */}
          Pickup: {formatPickupTime()}
        </span>
      </div>

      {/* Action Buttons */}
      {uiStatus === "pending" && (
        <div className="space-y-3">
          {isAsapOrder && (
            <input
              type="text"
              placeholder="Estimated preparation time (e.g. 20-30 mins)"
              value={estimatedTime || ""}
              onChange={(e) => onEstimatedTimeChange(order.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(order.id, uiToBackendStatus("confirmed"))}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onStatusChange(order.id, uiToBackendStatus("cancelled"))}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {uiStatus === "confirmed" && (
        <div className="space-y-3">
          {isAsapOrder && order.estimatedPickupTime ? (
            <p className="text-sm text-green-700 font-medium flex items-center">
              Ready in: {order.estimatedPickupTime}
            </p>
          ) : null}
          <button
            onClick={() => onStatusChange(order.id, uiToBackendStatus("completed"))}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Mark as Completed
          </button>
        </div>
      )}
    </div>
  );
}

const OrderList: React.FC<OrderListProps> = ({ orders, estimatedTimes, onEstimatedTimeChange, onStatusChange }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700">No Orders</h3>
        <p className="text-gray-500 mt-2">No orders to display in this category.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          estimatedTime={estimatedTimes[order.id]}
          onEstimatedTimeChange={onEstimatedTimeChange}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
};

export default OrderList; 