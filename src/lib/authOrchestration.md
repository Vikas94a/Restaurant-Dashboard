# Auth Orchestration Layer

## Overview

The Auth Orchestration Layer consolidates persistence clearing and timer management into a single, centralized service to avoid redundant logic paths that could fall out of sync.

## Architecture

### Core Components

1. **TimerManager** - Centralized timer management
2. **PersistenceManager** - Centralized persistence clearing
3. **AuthOrchestrator** - High-level auth workflow orchestration

### Key Benefits

- ✅ **Single Source of Truth**: All timer and persistence logic in one place
- ✅ **Consistency**: No more duplicate logic across components
- ✅ **Testability**: Centralized logic is easier to test
- ✅ **Maintainability**: Changes only need to be made in one location
- ✅ **Race Condition Prevention**: Built-in protection against concurrent operations

## Usage

### Timer Management

```typescript
import { TimerManager } from '@/lib/authOrchestration';

// Clear all timers
TimerManager.clearAll();

// Set auto-logout timer
TimerManager.setAutoLogoutTimer(() => {
  // Handle auto-logout
});

// Set warning timer with updates
TimerManager.setWarningTimer(
  (remaining) => updateUI(remaining),
  () => handleTimeout()
);
```

### Persistence Management

```typescript
import { PersistenceManager } from '@/lib/authOrchestration';

// Clear all persistence data
PersistenceManager.clearAll();

// Clear basic persistence (for AuthProvider)
PersistenceManager.clearBasic();
```

### Auth Orchestration

```typescript
import { AuthOrchestrator } from '@/lib/authOrchestration';

// Complete sign-out workflow
await AuthOrchestrator.signOut();

// Handle session expiration
await AuthOrchestrator.handleSessionExpiration();

// Handle invalid session
await AuthOrchestrator.handleInvalidSession();
```

## Migration Guide

### Before (Scattered Logic)

```typescript
// In authSlice.ts
const clearAllTimers = () => { /* ... */ };
const clearStorage = () => { /* ... */ };

// In AuthProvider.tsx
const clearPersistedData = () => { /* ... */ };

// In components
localStorage.removeItem('persist:root');
sessionStorage.clear();
```

### After (Centralized)

```typescript
// Everywhere
import { AuthOrchestrator, TimerManager, PersistenceManager } from '@/lib/authOrchestration';

// Use orchestration layer
await AuthOrchestrator.signOut();
TimerManager.clearAll();
PersistenceManager.clearAll();
```

## Testing

The orchestration layer includes comprehensive tests covering:

- Timer management (creation, clearing, callbacks)
- Persistence clearing (localStorage, sessionStorage, Redux persist)
- Auth workflows (sign-out, session expiration, invalid sessions)
- Race condition prevention
- Error handling

## Constants

```typescript
export const TIMER_CONSTANTS = {
  AUTO_LOGOUT_DURATION: 60 * 60 * 1000, // 1 hour
  WARNING_DURATION: 2 * 60 * 1000, // 2 minutes
} as const;
```

## Status Monitoring

```typescript
// Get current orchestration status
const status = AuthOrchestrator.getStatus();
console.log(status.isLoggingOut);
console.log(status.timers.hasAutoLogoutTimer);
```

## Error Handling

The orchestration layer provides consistent error handling:

- Firebase Auth errors are caught and re-thrown with user-friendly messages
- Storage clearing errors are logged but don't break the flow
- Timer operations are atomic (all or nothing)
- Concurrent operations are prevented with the `isLoggingOut` flag

## Future Enhancements

- Add metrics collection for auth events
- Implement retry logic for failed operations
- Add audit logging for security events
- Support for multiple auth providers
