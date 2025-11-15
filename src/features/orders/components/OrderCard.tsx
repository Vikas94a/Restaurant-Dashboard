/**
 * Compact OrderCard component optimized for mobile
 * Shows multiple orders on one screen
 */

"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCheck,
  faXmark,
  faUser,
  faPhone,
  faEnvelope,
  faCalendar,
  faReceipt,
  faCheckCircle,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/types/checkout';
import { CartItem as OrderItem } from '@/types/cart';
import { BackendOrderStatus, UIOrderStatus, OrderTimer } from '../types';
import { backendToUIStatus, uiToBackendStatus, formatPickupTime, formatOrderTime, formatTimeLeft } from '../utils/statusMapping';
import OrderActions from './OrderActions';

interface OrderCardProps {
  order: Order;
  estimatedTime: string;
  onEstimatedTimeChange: (orderId: string, time: string) => void;
  onStatusChange: (orderId: string, status: BackendOrderStatus, cancellationReason?: string) => void;
  cancellationReason: string;
  onCancellationReasonChange: (orderId: string, reason: string) => void;
  asapTimer?: OrderTimer;
  preparationTimer?: OrderTimer;
}

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

export default function OrderCard({
  order,
  estimatedTime,
  onEstimatedTimeChange,
  onStatusChange,
  cancellationReason,
  onCancellationReasonChange,
  asapTimer,
  preparationTimer,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const uiStatus = backendToUIStatus(order.status) as UIOrderStatus;
  const isAsapOrder = order.pickupOption === 'asap';
  const statusInfo = statusColors[uiStatus];

  return (
    <div className={`rounded-lg border-2 transition-all duration-200 ${statusInfo.bg} ${statusInfo.border} ${
      isExpanded ? 'p-3 md:p-4' : 'p-2 md:p-3'
    }`}>
      {/* Compact Header - Always Visible */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-bold text-gray-900 truncate">
                #{order.id.slice(-6)}
              </h3>
              <div className={`flex items-center px-1.5 py-0.5 rounded-full ${statusInfo.bg} border ${statusInfo.border} flex-shrink-0`}>
                <FontAwesomeIcon icon={statusInfo.icon} className={`w-3 h-3 mr-1 ${statusInfo.text}`} />
                <span className={`text-xs font-medium ${statusInfo.text}`}>
                  {uiStatus === "pending" && "Venter"}
                  {uiStatus === "confirmed" && "Bekreftet"}
                  {uiStatus === "cancelled" && "Avvist"}
                  {uiStatus === "completed" && "Fullført"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-600 truncate">{order.customerDetails?.name}</p>
            <p className="text-xs text-gray-500">{formatOrderTime(order.createdAt)}</p>
          </div>
        </div>
        
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Info - Always Visible */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center text-gray-600">
          <FontAwesomeIcon icon={faCalendar} className="w-3 h-3 mr-1" />
          <span className="truncate">{formatPickupTime(order.pickupOption, order.customerDetails.pickupDate, order.pickupTime)}</span>
        </div>
        <span className="font-semibold text-gray-900">{order.total.toFixed(2)} kr</span>
      </div>

      {/* ASAP Timer - Always Visible if Active */}
      {isAsapOrder && uiStatus === "pending" && asapTimer && (
        <div className="mt-2 flex items-center justify-between bg-yellow-100 rounded px-2 py-1">
          <span className="text-xs font-medium text-yellow-800">Tid igjen:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            asapTimer.timeLeft < 60000 ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
          }`}>
            {formatTimeLeft(asapTimer.timeLeft)}
          </span>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
          {/* Customer Details */}
          <div className="bg-white/70 rounded-lg p-2 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2 text-xs md:text-sm flex items-center">
              <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-orange-500 mr-1" />
              Kundedetaljer
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-gray-400 mr-2" />
                <span className="text-gray-700">{order.customerDetails?.name}</span>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faPhone} className="w-3 h-3 text-gray-400 mr-2" />
                <span className="text-gray-700">{order.customerDetails?.phone}</span>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 text-gray-400 mr-2" />
                <span className="text-gray-700 truncate">{order.customerDetails?.email}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 text-xs md:text-sm flex items-center">
              <FontAwesomeIcon icon={faReceipt} className="w-3 h-3 text-orange-500 mr-1" />
              Bestilte varer
            </h4>
            <div className="bg-white/70 rounded-lg p-2 border border-gray-200 space-y-2 max-h-48 overflow-y-auto">
              {order.items.map((item: OrderItem, i: number) => (
                <div key={i} className="py-2 border-b border-gray-100 last:border-none">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs font-medium mr-2">
                          {item.quantity}x
                        </span>
                        <span className="font-medium text-gray-800 text-xs truncate">{item.itemName}</span>
                      </div>
                      
                      {/* Customizations */}
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="mt-1 ml-5 space-y-1">
                          {item.customizations.map((customization) => (
                            <div key={customization.category} className="text-xs">
                              <span className="font-medium text-gray-700">{customization.category}:</span>
                              {customization.options.length === 0 ? (
                                <span className="text-gray-400 italic ml-1">Ingen</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {customization.options.map((option) => (
                                    <span
                                      key={option.id}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs"
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
                        <div className="mt-1 ml-5 text-xs">
                          <span className="font-medium text-blue-700">Spesiell forespørsel:</span>
                          <span className="ml-1 italic text-gray-600">{item.specialInstructions.text}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-900 font-semibold text-xs ml-2 flex-shrink-0">
                      {(item.itemPrice * item.quantity).toFixed(2)} kr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Timer */}
          {isAsapOrder && uiStatus === "confirmed" && preparationTimer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-800">Tilberedningstid igjen:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  preparationTimer.timeLeft < 300000 ? 'bg-red-200 text-red-800' : 
                  preparationTimer.timeLeft < 600000 ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                }`}>
                  {formatTimeLeft(preparationTimer.timeLeft)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <OrderActions
            order={order}
            uiStatus={uiStatus}
            isAsapOrder={isAsapOrder}
            estimatedTime={estimatedTime}
            onEstimatedTimeChange={onEstimatedTimeChange}
            onStatusChange={onStatusChange}
            cancellationReason={cancellationReason}
            onCancellationReasonChange={onCancellationReasonChange}
            estimatedPickupTime={order.estimatedPickupTime || undefined}
            preparationTimer={preparationTimer}
          />
        </div>
      )}
    </div>
  );
}

