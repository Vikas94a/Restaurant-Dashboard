import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/types/checkout';

interface OrderStatusProps {
  placedOrder: Order;
  showOrderStatus: boolean;
  setShowOrderStatus: React.Dispatch<React.SetStateAction<boolean>>;
  onReturnToMenu: () => void;
  restaurantId?: string;
}

const OrderStatus: React.FC<OrderStatusProps> = ({
  placedOrder,
  showOrderStatus,
  setShowOrderStatus,
  onReturnToMenu
}) => {
  if (!showOrderStatus) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Order process complete.</div>;
  }

  return (
    <div className="fixed inset-0 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          {placedOrder.status === 'pending' && (
            <>
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Waiting for Restaurant Response</h3>
              <p className="text-gray-600 mb-4">Your order is being reviewed by the restaurant.</p>
            </>
          )}
          
          {placedOrder.status === 'accepted' && (
            <>
              <FontAwesomeIcon icon={faCheck} className="text-4xl text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Order Accepted!</h3>
              <p className="text-gray-600 mb-4">Your order has been accepted by the restaurant.</p>
              {placedOrder.estimatedPickupTime && (
                <p className="text-gray-600 mt-2">Estimated pickup time: <span className="font-medium text-green-700">{placedOrder.estimatedPickupTime} min</span></p>
              )}
              {!placedOrder.estimatedPickupTime && (
                <p className="text-gray-600 mt-2 italic">No estimated pickup time provided.</p>
              )}
            </>
          )}
          
          {placedOrder.status === 'rejected' && (
            <>
              <FontAwesomeIcon icon={faTimes} className="text-4xl text-red-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Order Rejected</h3>
              <p className="text-gray-600 mb-4">Sorry, your order was rejected by the restaurant.</p>
            </>
          )}

          <div className="flex justify-center gap-4">
            {(placedOrder.status === 'accepted' || placedOrder.status === 'rejected') && (
              <button
                onClick={onReturnToMenu}
                className="bg-primary text-white px-6 py-2 mt-4 rounded-lg hover:bg-primary-dark transition"
              >
                Return to Menu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
