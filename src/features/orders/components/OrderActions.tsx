/**
 * OrderActions component - handles order status actions
 * Shows cancellation reason only when user clicks reject
 */

"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faClock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/types/checkout';
import { BackendOrderStatus, UIOrderStatus, OrderTimer } from '../types';
import { uiToBackendStatus } from '../utils/statusMapping';

interface OrderActionsProps {
  order: Order;
  uiStatus: UIOrderStatus;
  isAsapOrder: boolean;
  estimatedTime: string;
  onEstimatedTimeChange: (orderId: string, time: string) => void;
  onStatusChange: (orderId: string, status: BackendOrderStatus, cancellationReason?: string) => void;
  cancellationReason: string;
  onCancellationReasonChange: (orderId: string, reason: string) => void;
  estimatedPickupTime?: string;
  preparationTimer?: OrderTimer;
}

const CANCELLATION_REASONS = [
  { value: "Restaurant is busy - unable to process your order at this time", label: "Restaurant er opptatt" },
  { value: "Item not available - we apologize for the inconvenience", label: "Vare ikke tilgjengelig" },
  { value: "Kitchen is closed - please try again later", label: "Kjøkken er stengt" },
  { value: "Technical issue - please contact us directly", label: "Teknisk problem" },
  { value: "Order too large for current capacity", label: "Bestilling for stor" },
  { value: "Special dietary requirements cannot be accommodated", label: "Spesielle krav kan ikke imøtekommes" },
  { value: "Custom reason", label: "Annen årsak" },
];

export default function OrderActions({
  order,
  uiStatus,
  isAsapOrder,
  estimatedTime,
  onEstimatedTimeChange,
  onStatusChange,
  cancellationReason,
  onCancellationReasonChange,
  estimatedPickupTime,
  preparationTimer,
}: OrderActionsProps) {
  const [showCancellationReason, setShowCancellationReason] = useState(false);
  const [customReason, setCustomReason] = useState('');

  const handleRejectClick = () => {
    setShowCancellationReason(true);
  };

  const handleRejectConfirm = () => {
    const reason = cancellationReason === 'Custom reason' 
      ? customReason.trim() 
      : cancellationReason;
    
    if (!reason) {
      // Validation will be handled by parent
      return;
    }
    
    onStatusChange(order.id, uiToBackendStatus('cancelled'), reason);
    setShowCancellationReason(false);
    setCustomReason('');
  };

  const handleCancelReject = () => {
    setShowCancellationReason(false);
    setCustomReason('');
    onCancellationReasonChange(order.id, '');
  };

  if (uiStatus === "pending") {
    return (
      <div className="space-y-3">
        {/* Estimated Time Input for ASAP Orders */}
        {isAsapOrder && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <label className="block text-xs font-medium text-yellow-800 mb-1">
              Estimert tilberedningstid (minutter)
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              max="120"
              placeholder="f.eks. 25"
              value={estimatedTime || ""}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers
                if (value === '' || /^\d+$/.test(value)) {
                  onEstimatedTimeChange(order.id, value);
                }
              }}
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
            />
            <p className="text-xs text-yellow-700 mt-1">Angi antall minutter (f.eks. 25 for 25 minutter)</p>
          </div>
        )}

        {/* Cancellation Reason - Only shown when user clicks reject */}
        {showCancellationReason ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
            <label className="block text-xs font-medium text-red-800">
              Årsak for avvisning *
            </label>
            <select
              value={cancellationReason || ""}
              onChange={(e) => {
                onCancellationReasonChange(order.id, e.target.value);
                if (e.target.value !== 'Custom reason') {
                  setCustomReason('');
                }
              }}
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
            >
              <option value="">Velg årsak...</option>
              {CANCELLATION_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            
            {/* Custom reason input */}
            {cancellationReason === 'Custom reason' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Beskriv årsaken..."
                rows={2}
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={handleRejectConfirm}
                disabled={!cancellationReason || (cancellationReason === 'Custom reason' && !customReason.trim())}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bekreft avvisning
              </button>
              <button
                onClick={handleCancelReject}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          /* Action Buttons */
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onStatusChange(order.id, uiToBackendStatus("confirmed"))}
              className="flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2 w-4 h-4" />
              Aksepter
            </button>
            <button
              onClick={handleRejectClick}
              className="flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FontAwesomeIcon icon={faXmark} className="mr-2 w-4 h-4" />
              Avvis
            </button>
          </div>
        )}
      </div>
    );
  }

  if (uiStatus === "confirmed") {
    return (
      <div className="space-y-3">
        {isAsapOrder && estimatedPickupTime && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Estimert klar om: {estimatedPickupTime}
                </span>
              </div>
              {preparationTimer && preparationTimer.timeLeft === 0 && (
                <span className="text-xs font-bold text-green-800 bg-green-200 px-2 py-1 rounded">
                  KLAR!
                </span>
              )}
            </div>
          </div>
        )}
        <button
          onClick={() => onStatusChange(order.id, uiToBackendStatus("completed"))}
          className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <FontAwesomeIcon icon={faCheckCircle} className="mr-2 w-4 h-4" />
          Marker som fullført
        </button>
      </div>
    );
  }

  return null;
}

