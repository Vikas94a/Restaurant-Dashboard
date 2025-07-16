"use client";

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, User as FirebaseUser } from "firebase/auth";
import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";
import { toast } from "sonner";
// import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Auto-logout timer variable and duration
let autoLogoutTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_LOGOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Warning timer variables and duration
let warningTimer: ReturnType<typeof setTimeout> | null = null;
const WARNING_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds
let warningTimerInterval: ReturnType<typeof setInterval> | null = null;

// Flag to track if we're in the process of logging out
let isLoggingOut = false;

// Debug function to log timer status
// const logTimerStatus = undefined;

// Define serializable user type
interface SerializableUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }>;
}

// Convert Firebase User to serializable format
// const serializeUser = undefined;

// Define a type for the serialized user data
interface SerializedUserData extends SerializableUser {
  restaurantName?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown; // Allow additional properties from Firestore with unknown type
}

// Define error types
interface AuthError {
  code?: string;
  message?: string;
}

// Replace any types with proper types
interface FirebaseError {
  code?: string;
  message?: string;
  [key: string]: unknown;
}

interface RetryableOperation<T> {
  (): Promise<T>;
}

interface UnknownError {
  code?: string;
  message?: string;
  [key: string]: unknown;
}

// Types
export interface AuthState {
  user: SerializedUserData | null;
  restaurantDetails: Restaurant | undefined;
  restaurantName: string;
  domain: string;
  isLogoutWarningModalVisible: boolean;
  warningTimerRemaining: number;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: AuthState = {
  user: null,
  restaurantDetails: undefined,
  restaurantName: "",
  domain: "",
  isLogoutWarningModalVisible: false,
  warningTimerRemaining: 0,
  rememberMe: false,
  isLoading: false,
  error: null,
  status: 'idle'
};

// Helper function to convert Timestamp to string
const convertTimestampToString = (timestamp: Timestamp | undefined) => {
  if (!timestamp) return undefined;
  return timestamp.toDate().toISOString();
};

// Helper function to clear all timers
const clearAllTimers = () => {
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
};

// Error message mapping for auth operations
const AUTH_ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/operation-not-allowed': 'Email/password sign in is not enabled.',
  'auth/persistence-error': 'Unable to save login preferences. Please try again.',
  'auth/unauthorized': 'You are not authorized to perform this action.',
  'auth/invalid-credential': 'Invalid credentials. Please try again.',
  'auth/persistence-failed': 'Failed to save login preferences. Please try again.',
  'default': 'An unexpected error occurred. Please try again.'
} as const;

// Helper function to get user-friendly error message
const getAuthErrorMessage = (error: AuthError): string => {
  const errorCode = error?.code || 'default';
  return AUTH_ERROR_MESSAGES[errorCode as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.default;
};

// Retryable Firebase error codes
const RETRYABLE_ERROR_CODES = {
  'auth/network-request-failed': true,
  'auth/too-many-requests': true,
  'auth/internal-error': true,
  'auth/operation-not-allowed': true,
  'auth/service-unavailable': true,
  'auth/temporarily-disabled': true,
} as const;

// Maximum number of retries for operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Helper function to check if an error is retryable
const isRetryableError = (error: AuthError): boolean => {
  return error?.code ? RETRYABLE_ERROR_CODES[error.code as keyof typeof RETRYABLE_ERROR_CODES] : false;
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for async operations
// const withRetry = undefined;

// Async thunks
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`[Auth] Retry attempt ${attempt + 1}/${maxRetries} after error:`, error.code);
      await delay(delayMs * Math.pow(2, attempt)); // Exponential backoff
    }
  }
  
  throw lastError;
};

// Async thunks
export const fetchUserData = createAsyncThunk<SerializedUserData | null, FirebaseUser>(
  'auth/fetchUserData',
  async (user) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      return {
        ...userData,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
        },
        providerData: user.providerData.map(provider => ({
          providerId: provider.providerId,
          uid: provider.uid,
          displayName: provider.displayName,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          photoURL: provider.photoURL,
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch user data');
    }
  }
);

export const fetchRestaurantData = createAsyncThunk(
  'auth/fetchRestaurantData',
  async (userId: string, { rejectWithValue }) => {
    try {
      const q = query(collection(db, "restaurants"), where("ownerId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const restaurantDoc = querySnapshot.docs[0];
        const data = restaurantDoc.data() as Restaurant;
        data.restaurantId = restaurantDoc.id;

        // Convert Timestamps to strings
        const createdAt = data.createdAt as unknown as Timestamp;
        const updatedAt = data.updatedAt as unknown as Timestamp;

        if (createdAt && typeof createdAt.toDate === 'function') {
          data.createdAt = convertTimestampToString(createdAt);
        }
        if (updatedAt && typeof updatedAt.toDate === 'function') {
          data.updatedAt = convertTimestampToString(updatedAt);
        }

        return data;
      }
      return undefined;
    } catch (error: any) {
      console.error('[Auth] Error fetching restaurant data:', error);
      return rejectWithValue(getAuthErrorMessage(error));
    }
  }
);

// New thunk for handling auto-logout warning
export const startAutoLogoutWarning = createAsyncThunk(
  'auth/startAutoLogoutWarning',
  async (_, { dispatch }) => {
    clearAllTimers();
    
    warningTimer = setTimeout(() => {
      dispatch(logout());
    }, WARNING_DURATION);
    
    const startTime = Date.now();
    warningTimerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, WARNING_DURATION - elapsed);
      dispatch(updateWarningTimer(remaining));
      
      if (remaining <= 0) {
        clearInterval(warningTimerInterval!);
      }
    }, 1000);
    
    return WARNING_DURATION;
  }
);

// New thunk for resetting auto-logout timer
export const resetAutoLogoutTimer = createAsyncThunk(
  'auth/resetAutoLogoutTimer',
  async (_, { dispatch }) => {
    clearAllTimers();
    
    autoLogoutTimer = setTimeout(() => {
      dispatch(showLogoutWarningModal(true));
      dispatch(startAutoLogoutWarning());
    }, AUTO_LOGOUT_DURATION);
    
    return AUTO_LOGOUT_DURATION;
  }
);

// New thunk for setting persistence
export const setAuthPersistence = createAsyncThunk(
  'auth/setPersistence',
  async (rememberMe: boolean, { rejectWithValue }) => {
    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      return rememberMe;
    } catch (error: any) {
      console.error('[Auth] Error setting auth persistence:', error);
      return rejectWithValue(getAuthErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      if (isLoggingOut) return;
      isLoggingOut = true;

      clearAllTimers();

      import('firebase/auth').then(({ signOut }) => {
        signOut(auth).catch((error) => {
          console.error('[Auth] Error during sign out:', error);
          toast.error('Error signing out. Please try again.');
        });
      });

      const clearAuthData = () => {
        try {
          const persistedState = localStorage.getItem('persist:root');
          if (persistedState) {
            const parsed = JSON.parse(persistedState);
            if (parsed.auth) {
              delete parsed.auth;
              localStorage.setItem('persist:root', JSON.stringify(parsed));
            }
          }

          localStorage.removeItem(`firebase:authUser:${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}:[DEFAULT]`);

          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('firebase:') || key.startsWith('persist:')) {
              localStorage.removeItem(key);
            }
          });

          sessionStorage.clear();

          state.user = null;
          state.restaurantDetails = undefined;
          state.restaurantName = "";
          state.domain = "";
          state.isLoading = false;
          state.error = null;

        } catch (e) {
          console.error('[Auth] Error during logout cleanup:', e);
          toast.error('Error clearing session data. Please try again.');
        } finally {
          isLoggingOut = false;
        }
      };

      clearAuthData();
    },
    showLogoutWarningModal: (state, action: PayloadAction<boolean>) => {
      state.isLogoutWarningModalVisible = action.payload;
      if (!action.payload) {
        state.warningTimerRemaining = 0;
      }
    },
    updateWarningTimer: (state, action: PayloadAction<number>) => {
      state.warningTimerRemaining = action.payload;
    },
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        if (action.payload?.restaurantName) {
          state.restaurantName = action.payload.restaurantName;
        }
        if (action.payload?.domain) {
          state.domain = action.payload.domain;
        }
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
        state.user = null;
        toast.error(typeof action.payload === 'string' ? action.payload : 'Failed to fetch user data');
      })
      .addCase(fetchRestaurantData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantData.fulfilled, (state, action) => {
        state.restaurantDetails = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchRestaurantData.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
        toast.error(typeof action.payload === 'string' ? action.payload : 'Failed to load restaurant details');
      })
      .addCase(startAutoLogoutWarning.fulfilled, (state, action) => {
        state.warningTimerRemaining = action.payload;
      })
      .addCase(resetAutoLogoutTimer.fulfilled, (state) => {
        state.isLogoutWarningModalVisible = false;
        state.warningTimerRemaining = 0;
      })
      .addCase(setAuthPersistence.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setAuthPersistence.fulfilled, (state, action) => {
        state.rememberMe = action.payload;
        state.isLoading = false;
      })
      .addCase(setAuthPersistence.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
        toast.error(typeof action.payload === 'string' ? action.payload : AUTH_ERROR_MESSAGES.default);
      });
  },
});

// Add a function to initialize the auth state
export const initializeAuth = () => {
  return (dispatch: any) => {
    let isInitialized = false;

    // Return the unsubscribe function from onAuthStateChanged
    return onAuthStateChanged(auth, (user) => {
      console.log('[AutoLogout] Auth state changed', { hasUser: !!user, isLoggingOut, isInitialized });

      // Skip if we're in the middle of logging out
      if (isLoggingOut) {
        console.log('[AutoLogout] Skipping auth state change during logout');
        return;
      }

      // Skip initial auth state check to prevent unnecessary reloads
      if (!isInitialized) {
        isInitialized = true;
        if (!user) {
          dispatch(setLoading(false));
          return;
        }
      }

      if (user) {
        // Only proceed with login if we're not in the middle of logging out
        if (!isLoggingOut) {
          dispatch(setLoading(true));
          dispatch(fetchUserData(user))
            .unwrap()
            .then((userData: any) => {
              if (userData && !isLoggingOut) {
                return dispatch(fetchRestaurantData(userData.uid)).unwrap();
              }
            })
            .catch((error: unknown) => {
              console.error('[Auth] Error during initialization:', error);
              toast.error('Failed to initialize application');
            })
            .finally(() => {
              dispatch(setLoading(false));
            });
        }
      } else {
        // Only dispatch logout if we're not already logging out and not in initial state
        if (!isLoggingOut && isInitialized) {
          dispatch(logout());
        }
      }
    });
  };
};

export const { 
  setLoading, 
  setError, 
  logout, 
  showLogoutWarningModal, 
  updateWarningTimer,
  setRememberMe 
} = authSlice.actions;

export default authSlice.reducer; 