import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheck, faXmark, faUser, faPhone, faEnvelope, faCalendar, faExclamationTriangle, faCheckCircle, faReceipt } from '@fortawesome/free-solid-svg-icons';
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
  const statusColors: Record<string, { bg: string; border: string; text: string; icon: any }> = {
    pending: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: faClock
    },
    confirmed: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: faCheckCircle
    },
    cancelled: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: faXmark
    },
    completed: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: faCheckCircle
    },
    ready: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: faCheckCircle
    },
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
  const statusInfo = statusColors[uiStatus];

  const formatPickupTime = () => {
    if (isAsapOrder) return 'Så snart som mulig';
    const pickupDate = new Date(order.customerDetails.pickupDate);
    const today = new Date();
    const isToday = pickupDate.toDateString() === today.toDateString();
    if (isToday) {
      return `I dag kl. ${order.pickupTime}`;
    } else {
      const day = pickupDate.getDate();
      const weekday = pickupDate.toLocaleDateString('nb-NO', { weekday: 'long' });
      return `${day}. ${weekday} kl. ${order.pickupTime}`;
    }
  };

  const formatOrderTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${statusInfo.bg} ${statusInfo.border}`}>
      {/* Order Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
            <FontAwesomeIcon icon={faReceipt} className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Bestilling #{order.id.slice(-6)}
            </h3>
            <p className="text-sm text-gray-600">
              {formatOrderTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className={`flex items-center px-3 py-1 rounded-full ${statusInfo.bg} border ${statusInfo.border}`}>
          <FontAwesomeIcon icon={statusInfo.icon} className={`w-4 h-4 mr-2 ${statusInfo.text}`} />
          <span className={`text-sm font-medium ${statusInfo.text}`}>
            {uiStatus === "pending" && "Venter"}
            {uiStatus === "confirmed" && "Bekreftet"}
            {uiStatus === "cancelled" && "Avvist"}
            {uiStatus === "completed" && "Fullført"}
            {uiStatus === "ready" && "Klar"}
          </span>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white/70 rounded-lg p-4 mb-6 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-orange-500 mr-2" />
          Kundedetaljer
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-700">{order.customerDetails?.name}</span>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-700">{order.customerDetails?.phone}</span>
          </div>
          <div className="flex items-center md:col-span-2">
            <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-700">{order.customerDetails?.email}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-orange-500 mr-2" />
          Bestilte varer
        </h4>
        <div className="bg-white/70 rounded-lg p-4 border border-gray-200 space-y-3">
          {order.items.map((item: OrderItem, i: number) => (
            <div key={i} className="py-3 border-b border-gray-100 last:border-none">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium mr-3">
                      {item.quantity}x
                    </span>
                    <span className="font-medium text-gray-800">{item.itemName}</span>
                  </div>
                  
                  {/* Customizations/Extras */}
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="mt-2 ml-5 space-y-1">
                      {item.customizations.map((customization) => (
                        <div key={customization.category} className="text-sm">
                          <span className="font-medium text-gray-700">{customization.category}:</span>
                          {customization.options.length === 0 ? (
                            <span className="text-gray-400 italic ml-1">Ingen</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {customization.options.map((option) => (
                                <span
                                  key={option.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs border border-orange-200"
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
                    <div className="mt-2 ml-5 text-sm">
                      <span className="font-medium text-blue-700">Spesiell forespørsel:</span>
                      <span className="ml-1 italic text-gray-600">{item.specialInstructions.text}</span>
                    </div>
                  )}
                </div>
                <span className="text-gray-900 font-semibold ml-4">
                  {(item.itemPrice * item.quantity).toFixed(2)} kr
                </span>
              </div>
            </div>
          ))}
          
          <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Totalt</span>
            <span className="text-xl font-bold text-gray-900">
              {order.total.toFixed(2)} kr
            </span>
          </div>
        </div>
      </div>

      {/* Pickup Time */}
      <div className="bg-white/70 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-orange-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Hentetid:</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{formatPickupTime()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {uiStatus === "pending" && (
        <div className="space-y-4">
          {isAsapOrder && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-yellow-800 mb-2">
                Estimert tilberedningstid
              </label>
              <input
                type="text"
                placeholder="f.eks. 20-30 minutter"
                value={estimatedTime || ""}
                onChange={(e) => onEstimatedTimeChange(order.id, e.target.value)}
                className="w-full px-4 py-2 border border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onStatusChange(order.id, uiToBackendStatus("confirmed"))}
              className="flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Aksepter
            </button>
            <button
              onClick={() => onStatusChange(order.id, uiToBackendStatus("cancelled"))}
              className="flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FontAwesomeIcon icon={faXmark} className="mr-2" />
              Avvis
            </button>
          </div>
        </div>
      )}

      {uiStatus === "confirmed" && (
        <div className="space-y-4">
          {isAsapOrder && order.estimatedPickupTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Klar om: {order.estimatedPickupTime}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => onStatusChange(order.id, uiToBackendStatus("completed"))}
            className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            Marker som fullført
          </button>
        </div>
      )}
    </div>
  );
}

const OrderList: React.FC<OrderListProps> = ({ orders, estimatedTimes, onEstimatedTimeChange, onStatusChange }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FontAwesomeIcon icon={faReceipt} className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Ingen bestillinger</h3>
        <p className="text-gray-500 text-center max-w-md">
          Det er ingen bestillinger å vise i denne kategorien for øyeblikket.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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