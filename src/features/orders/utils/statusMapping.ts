/**
 * Utility functions for order status mapping
 */

import { BackendOrderStatus, UIOrderStatus } from '../types';

/**
 * Map backend status to UI status
 */
export function backendToUIStatus(status: string): UIOrderStatus | 'pending' | 'ready' {
  if (status === 'accepted') return 'confirmed';
  if (status === 'rejected') return 'cancelled';
  return status as UIOrderStatus | 'pending' | 'ready';
}

/**
 * Map UI status to backend status
 */
export function uiToBackendStatus(status: UIOrderStatus): BackendOrderStatus {
  if (status === 'confirmed') return 'accepted';
  if (status === 'cancelled') return 'rejected';
  return 'completed';
}

/**
 * Format time left in milliseconds to MM:SS
 */
export function formatTimeLeft(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format pickup time based on order type
 */
export function formatPickupTime(
  pickupOption: string,
  pickupDate: string,
  pickupTime: string
): string {
  if (pickupOption === 'asap') return 'Så snart som mulig';
  
  const pickupDateObj = new Date(pickupDate);
  const today = new Date();
  const isToday = pickupDateObj.toDateString() === today.toDateString();
  
  if (isToday) {
    return `I dag kl. ${pickupTime}`;
  } else {
    const day = pickupDateObj.getDate();
    const weekday = pickupDateObj.toLocaleDateString('nb-NO', { weekday: 'long' });
    return `${day}. ${weekday} kl. ${pickupTime}`;
  }
}

/**
 * Format order creation timestamp
 */
export function formatOrderTime(timestamp: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

