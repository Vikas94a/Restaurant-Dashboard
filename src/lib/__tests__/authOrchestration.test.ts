/**
 * Tests for Auth Orchestration Layer
 * Ensures centralized persistence clearing and timer management works correctly
 */

import { AuthOrchestrator, TimerManager, PersistenceManager } from '../authOrchestration';

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockSessionStorage = {
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock Firebase auth
jest.mock('@/lib/firebase', () => ({
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));

describe('Auth Orchestration Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('TimerManager', () => {
    it('should clear all timers', () => {
      const callback = jest.fn();
      TimerManager.setAutoLogoutTimer(callback);
      TimerManager.setWarningTimer(jest.fn(), jest.fn());
      
      expect(TimerManager.getStatus().hasAutoLogoutTimer).toBe(true);
      expect(TimerManager.getStatus().hasWarningTimer).toBe(true);
      
      TimerManager.clearAll();
      
      expect(TimerManager.getStatus().hasAutoLogoutTimer).toBe(false);
      expect(TimerManager.getStatus().hasWarningTimer).toBe(false);
    });

    it('should set auto-logout timer correctly', () => {
      const callback = jest.fn();
      const duration = TimerManager.setAutoLogoutTimer(callback);
      
      expect(duration).toBe(60 * 60 * 1000); // 1 hour
      expect(TimerManager.getStatus().hasAutoLogoutTimer).toBe(true);
      
      // Fast-forward time
      jest.advanceTimersByTime(60 * 60 * 1000);
      expect(callback).toHaveBeenCalled();
    });

    it('should set warning timer with interval updates', () => {
      const onUpdate = jest.fn();
      const onComplete = jest.fn();
      
      TimerManager.setWarningTimer(onUpdate, onComplete);
      
      expect(TimerManager.getStatus().hasWarningTimer).toBe(true);
      expect(TimerManager.getStatus().hasWarningInterval).toBe(true);
      
      // Fast-forward time
      jest.advanceTimersByTime(2000); // 2 seconds
      expect(onUpdate).toHaveBeenCalled();
      
      jest.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('PersistenceManager', () => {
    it('should clear all persistence data', () => {
      mockLocalStorage.getItem.mockReturnValue('{"auth":{"user":"test"}}');
      mockLocalStorage.key.mockReturnValue('firebase:test');
      
      PersistenceManager.clearAll();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('persist:root');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('firebase:test');
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });

    it('should clear basic persistence data', () => {
      PersistenceManager.clearBasic();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('persist:root');
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });
  });

  describe('AuthOrchestrator', () => {
    it('should handle sign out workflow', async () => {
      const { signOut } = require('firebase/auth');
      signOut.mockResolvedValue(undefined);
      
      const result = await AuthOrchestrator.signOut();
      
      expect(result.success).toBe(true);
      expect(signOut).toHaveBeenCalled();
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });

    it('should handle session expiration', async () => {
      const { signOut } = require('firebase/auth');
      signOut.mockResolvedValue(undefined);
      
      await AuthOrchestrator.handleSessionExpiration();
      
      expect(signOut).toHaveBeenCalled();
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });

    it('should handle invalid session', async () => {
      const { signOut } = require('firebase/auth');
      signOut.mockResolvedValue(undefined);
      
      await AuthOrchestrator.handleInvalidSession();
      
      expect(signOut).toHaveBeenCalled();
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });

    it('should prevent concurrent sign out operations', async () => {
      const { signOut } = require('firebase/auth');
      signOut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const promise1 = AuthOrchestrator.signOut();
      const promise2 = AuthOrchestrator.signOut();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false); // Should be prevented
    });
  });
});
