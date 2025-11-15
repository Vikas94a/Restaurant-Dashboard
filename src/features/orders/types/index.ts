/**
 * Order-related type definitions
 */

export type BackendOrderStatus = 'accepted' | 'rejected' | 'completed';
export type UIOrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'ready';
export type OrderTab = 'active' | 'completed' | 'rejected';

export interface OrderTimer {
  timeLeft: number;
  interval: NodeJS.Timeout;
}

export interface OrderStats {
  active: number;
  completed: number;
  rejected: number;
}

