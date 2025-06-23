import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/types/order';

interface OrderStatusProps {
  placedOrder: Order;
  showOrderStatus: boolean;
  onReturnToMenu: () => void;
}

const OrderStatus: React.FC<OrderStatusProps> = ({
  placedOrder,
  showOrderStatus,
  onReturnToMenu
}) => {
  const isAsapOrder = placedOrder.pickupOption === 'asap';

  const pickupLabel = useMemo(() => {
    if (isAsapOrder) {
      if (placedOrder.estimatedPickupTime) {
        return `Estimated pickup time: ${placedOrder.estimatedPickupTime}`;
      }
      return null;
    }
    
    const dateStr = placedOrder.customerDetails.pickupDate;
    const time = placedOrder.pickupTime;
    if (!dateStr) return null;
    const dateObj = new Date(dateStr);
    const today = new Date();
    const isToday = dateObj.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Pickup time: Today at ${time}`;
    } else {
      const day = dateObj.getDate();
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      return `Pickup time: ${day} ${weekday} at ${time}`;
    }
  }, [isAsapOrder, placedOrder.customerDetails.pickupDate, placedOrder.pickupTime, placedOrder.estimatedPickupTime]);

  if (!showOrderStatus) return null;

  return (
    <div className="fixed inset-0 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          <FontAwesomeIcon icon={faCheck} className="text-4xl text-green-500 mx-auto" />
          <h3 className="text-xl font-semibold">
            {isAsapOrder ? 'Thank you for ordering from us!' : 'Your order has been received.'}
          </h3>
          {isAsapOrder ? (
            <p className="text-gray-700">
              {placedOrder.estimatedPickupTime 
                ? `Your order will be ready in approximately ${placedOrder.estimatedPickupTime}`
                : 'You will receive an email shortly with your order status and pickup time.'}
            </p>
          ) : (
            pickupLabel && <p className="text-gray-700">{pickupLabel}</p>
          )}
          <button
            onClick={onReturnToMenu}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
