/**
 * OrderList component - displays list of order cards
 */

"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/types/checkout';
import { BackendOrderStatus, OrderTimer } from '../types';
import OrderCard from './OrderCard';

interface OrderListProps {
  orders: Order[];
  estimatedTimes: Record<string, string>;
  onEstimatedTimeChange: (orderId: string, time: string) => void;
  onStatusChange: (orderId: string, status: BackendOrderStatus, cancellationReason?: string) => void;
  cancellationReasons: Record<string, string>;
  onCancellationReasonChange: (orderId: string, reason: string) => void;
  asapTimers: Record<string, OrderTimer>;
  preparationTimers: Record<string, OrderTimer>;
}

export default function OrderList({
  orders,
  estimatedTimes,
  onEstimatedTimeChange,
  onStatusChange,
  cancellationReasons,
  onCancellationReasonChange,
  asapTimers,
  preparationTimers,
}: OrderListProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          estimatedTime={estimatedTimes[order.id] || ''}
          onEstimatedTimeChange={onEstimatedTimeChange}
          onStatusChange={onStatusChange}
          cancellationReason={cancellationReasons[order.id] || ''}
          onCancellationReasonChange={onCancellationReasonChange}
          asapTimer={asapTimers[order.id]}
          preparationTimer={preparationTimers[order.id]}
        />
      ))}
    </div>
  );
}

