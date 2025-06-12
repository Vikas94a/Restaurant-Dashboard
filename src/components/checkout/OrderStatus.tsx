import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/types/checkout';

interface OrderStatusProps {
  placedOrder: Order;
  showOrderStatus: boolean;
  onReturnToMenu: () => void;
}

const OrderStatus: React.FC<OrderStatusProps> = ({
  placedOrder,
  showOrderStatus,
 
}) => {
  const isAsapOrder = placedOrder.customerDetails.pickupTime === 'asap';

  const pickupLabel = useMemo(() => {
    if (isAsapOrder) return null;
    const dateStr = placedOrder.customerDetails.pickupDate;
    const time = placedOrder.customerDetails.pickupTime;
    if (!dateStr) return null;
    const dateObj = new Date(dateStr);
    const today = new Date();
    const isToday = dateObj.toDateString() === today.toDateString();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateFormatted = isToday ? 'Today' : dateObj.toLocaleDateString(undefined, options);
    return `Pickup time: ${dateFormatted} at ${time}`;
  }, [isAsapOrder, placedOrder.customerDetails.pickupDate, placedOrder.customerDetails.pickupTime]);

  if (!showOrderStatus) return null;

  return (
    <div className="fixed inset-0 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          {/* ASAP ORDER FLOW */}
          {isAsapOrder && (
            <>
              <FontAwesomeIcon icon={faCheck} className="text-4xl text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Thank you for ordering from us!</h3>
              <p className="text-gray-700">
                You will receive an email shortly with your order status and pickup time.
              </p>
            
            </>
          )}

          {/* SCHEDULED ORDER FLOW */}
          {!isAsapOrder && (
            <>
              <FontAwesomeIcon icon={faCheck} className="text-4xl text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Your order has been received.</h3>
              {pickupLabel && <p className="text-gray-700">{pickupLabel}</p>}
              
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
