import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { toast } from 'sonner';

interface RejectedAction extends AnyAction {
  error: {
    message?: string;
    name?: string;
    code?: string;
  };
}

export const errorMiddleware: Middleware = () => (next) => (action: unknown) => {
  // Check if the action is rejected
  if (
    typeof action === 'object' && 
    action !== null && 
    'type' in action && 
    typeof (action as { type: string }).type === 'string' &&
    (action as { type: string }).type.endsWith('/rejected')
  ) {
    const rejectedAction = action as RejectedAction;
    const errorMessage = rejectedAction.error?.message || 'An unexpected error occurred';
    
    // Handle different types of errors
    if (rejectedAction.error?.name === 'FirebaseError') {
      switch (rejectedAction.error?.code) {
        case 'permission-denied':
          toast.error('You do not have permission to perform this action');
          break;
        case 'not-found':
          toast.error('The requested resource was not found');
          break;
        case 'unauthenticated':
          toast.error('Please sign in to continue');
          break;
        default:
          toast.error(errorMessage);
      }
    } else {
      toast.error(errorMessage);
    }
  }

  return next(action);
}; 