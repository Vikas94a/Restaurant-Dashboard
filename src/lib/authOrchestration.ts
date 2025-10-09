/**
 * Centralized Auth Orchestration Layer
 * Consolidates persistence clearing and timer management to avoid redundant logic
 */

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

// Timer management
let autoLogoutTimer: ReturnType<typeof setTimeout> | null = null;
let warningTimer: ReturnType<typeof setTimeout> | null = null;
let warningTimerInterval: ReturnType<typeof setInterval> | null = null;

// Timer constants
const AUTO_LOGOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const WARNING_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

// Flag to track if we're in the process of logging out
let isLoggingOut = false;

/**
 * Centralized timer management
 */
export const TimerManager = {
  /**
   * Clear all active timers
   */
  clearAll: () => {
    if (autoLogoutTimer) {
      clearTimeout(autoLogoutTimer);
      autoLogoutTimer = null;
    }
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }
    if (warningTimerInterval) {
      clearInterval(warningTimerInterval);
      warningTimerInterval = null;
    }
  },

  /**
   * Set auto-logout timer
   */
  setAutoLogoutTimer: (callback: () => void) => {
    TimerManager.clearAll();
    autoLogoutTimer = setTimeout(callback, AUTO_LOGOUT_DURATION);
    return AUTO_LOGOUT_DURATION;
  },

  /**
   * Set warning timer with interval updates
   */
  setWarningTimer: (onUpdate: (remaining: number) => void, onComplete: () => void) => {
    TimerManager.clearAll();
    
    warningTimer = setTimeout(onComplete, WARNING_DURATION);
    
    const startTime = Date.now();
    warningTimerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, WARNING_DURATION - elapsed);
      onUpdate(remaining);
      
      if (remaining <= 0) {
        clearInterval(warningTimerInterval!);
        warningTimerInterval = null;
      }
    }, 1000);
    
    return WARNING_DURATION;
  },

  /**
   * Get current timer status
   */
  getStatus: () => ({
    hasAutoLogoutTimer: autoLogoutTimer !== null,
    hasWarningTimer: warningTimer !== null,
    hasWarningInterval: warningTimerInterval !== null,
    isLoggingOut
  })
};

/**
 * Centralized persistence management
 */
export const PersistenceManager = {
  /**
   * Clear all persistence data (localStorage, sessionStorage, Redux persist)
   */
  clearAll: () => {
    try {
      // Clear Redux persist data
      const persistedState = localStorage.getItem('persist:root');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        if (parsed.auth) {
          delete parsed.auth;
          localStorage.setItem('persist:root', JSON.stringify(parsed));
        }
      }

      // Clear Firebase auth data
      localStorage.removeItem(`firebase:authUser:${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}:[DEFAULT]`);

      // Clear all Firebase and persist related keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.startsWith('persist:')) {
          localStorage.removeItem(key);
        }
      });

      // Clear session storage
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing persistence data:', error);
      throw new Error('Failed to clear session data');
    }
  },

  /**
   * Clear only basic persistence (used in AuthProvider)
   */
  clearBasic: () => {
    try {
      localStorage.removeItem('persist:root');
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing basic persistence data:', error);
    }
  }
};

/**
 * Centralized auth orchestration
 */
export const AuthOrchestrator = {
  /**
   * Complete sign-out workflow with all cleanup
   */
  signOut: async (): Promise<{ success: boolean }> => {
    if (isLoggingOut) {
      return { success: false };
    }

    isLoggingOut = true;

    try {
      // 1. Clear all timers
      TimerManager.clearAll();

      // 2. Sign out from Firebase Auth
      await signOut(auth);

      // 3. Clear all persistence data
      PersistenceManager.clearAll();

      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    } finally {
      isLoggingOut = false;
    }
  },

  /**
   * Handle session expiration
   */
  handleSessionExpiration: async (): Promise<void> => {
    try {
      await AuthOrchestrator.signOut();
      toast.error('Your session has expired. Please sign in again.');
    } catch (error) {
      // Fallback: try basic persistence clearing
      PersistenceManager.clearBasic();
      toast.error('Your session has expired. Please sign in again.');
    }
  },

  /**
   * Handle invalid session
   */
  handleInvalidSession: async (): Promise<void> => {
    try {
      await AuthOrchestrator.signOut();
    } catch (error) {
      // Fallback: try basic persistence clearing
      PersistenceManager.clearBasic();
    }
  },

  /**
   * Get current orchestration status
   */
  getStatus: () => ({
    isLoggingOut,
    timers: TimerManager.getStatus()
  })
};

/**
 * Export timer constants for external use
 */
export const TIMER_CONSTANTS = {
  AUTO_LOGOUT_DURATION,
  WARNING_DURATION
} as const;
