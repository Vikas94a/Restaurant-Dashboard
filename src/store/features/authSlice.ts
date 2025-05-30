import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";
import { store } from "../store";
import { toast } from "sonner";

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
const logTimerStatus = (action: string) => {
  console.log(`[AutoLogout] ${action} - Current time: ${new Date().toISOString()}`);
  console.log(`[AutoLogout] Next auto-logout at: ${autoLogoutTimer ? new Date(Date.now() + AUTO_LOGOUT_DURATION).toISOString() : 'No active timer'
    }`);
};

// Types
interface User {
  uid: string;
  restaurantName?: string;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: any;
  restaurantDetails: Restaurant | undefined;
  restaurantName: string;
  isLogoutWarningModalVisible: boolean;
  warningTimerRemaining: number;
  rememberMe: boolean;
  loadingStates: {
    userData: boolean;
    restaurantData: boolean;
    persistence: boolean;
    logout: boolean;
  };
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  restaurantDetails: undefined,
  restaurantName: "",
  isLogoutWarningModalVisible: false,
  warningTimerRemaining: 0,
  rememberMe: false,
  loadingStates: {
    userData: false,
    restaurantData: false,
    persistence: false,
    logout: false
  }
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
};

// Helper function to get user-friendly error message
const getAuthErrorMessage = (error: any): string => {
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
const isRetryableError = (error: any): boolean => {
  return error?.code && RETRYABLE_ERROR_CODES[error.code as keyof typeof RETRYABLE_ERROR_CODES];
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for async operations
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
export const fetchUserData = createAsyncThunk(
  'auth/fetchUserData',
  async (firebaseUser: any, { dispatch, rejectWithValue }) => {
    try {
      console.log('[AutoLogout] fetchUserData called', { hasUser: !!firebaseUser?.uid });

      if (!firebaseUser || !firebaseUser.uid) {
        console.log('[AutoLogout] No user or UID - clearing any existing timer');
        clearAllTimers();
        return null;
      }

      // Clear any existing timers when user data is (re)fetched
      clearAllTimers();

      const userData = await withRetry(async () => {
        const refUserDoc = doc(db, "users", firebaseUser.uid);
        const docSnapshot = await getDoc(refUserDoc);

        if (docSnapshot.exists()) {
          const data = { uid: firebaseUser.uid, ...docSnapshot.data() } as User;

          // Start the auto-logout timer if user data is successfully fetched
          console.log(`[AutoLogout] Setting new auto-logout timer for ${AUTO_LOGOUT_DURATION / 1000 / 60} minutes`);
          
          // Use the thunk to set up the timer
          dispatch(resetAutoLogoutTimer());

          return data;
        }

        console.log('[AutoLogout] User document not found - no timer set');
        return null;
      });

      return userData;
    } catch (error: any) {
      console.error('[Auth] Error fetching user data:', error);
      return rejectWithValue(getAuthErrorMessage(error));
    }
  }
);

export const fetchRestaurantData = createAsyncThunk(
  'auth/fetchRestaurantData',
  async (userId: string, { rejectWithValue }) => {
    try {
      const restaurantData = await withRetry(async () => {
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
      });

      return restaurantData;
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
    
    // Start warning countdown
    warningTimer = setTimeout(() => {
      dispatch(logout());
    }, WARNING_DURATION);
    
    // Update remaining time every second
    let startTime = Date.now();
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
    
    // Set new auto-logout timer
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
  async (rememberMe: boolean, { dispatch, rejectWithValue }) => {
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
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<any>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      if (isLoggingOut) return;
      isLoggingOut = true;

      // Ensure loadingStates exists before accessing it
      if (!state.loadingStates) {
        state.loadingStates = {
          userData: false,
          restaurantData: false,
          persistence: false,
          logout: false
        };
      }
      
      state.loadingStates.logout = true;

      console.log('[AutoLogout] Logout action triggered');

      // Clear all timers
      clearAllTimers();

      // Clear Firebase auth state
      import('firebase/auth').then(({ signOut }) => {
        signOut(auth).catch((error) => {
          console.error('[Auth] Error during sign out:', error);
          toast.error('Error signing out. Please try again.');
        });
      });

      // Clear all auth data from localStorage
      const clearAuthData = () => {
        try {
          // Clear Redux Persist data
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

          // Clear any other Firebase-related data
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('firebase:') || key.startsWith('persist:')) {
              localStorage.removeItem(key);
            }
          });

          // Clear session storage as well
          sessionStorage.clear();

          // Reset state
          state.user = null;
          state.restaurantDetails = undefined;
          state.restaurantName = "";
          state.loading = false;
          state.error = null;
          state.loadingStates.logout = false;

        } catch (e) {
          console.error('[Auth] Error during logout cleanup:', e);
          toast.error('Error clearing session data. Please try again.');
          state.loadingStates.logout = false;
        } finally {
          isLoggingOut = false;
        }
      };

      // Execute cleanup
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
      // Handle fetchUserData
      .addCase(fetchUserData.pending, (state) => {
        state.loadingStates.userData = true;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loadingStates.userData = false;
        if (action.payload?.restaurantName) {
          state.restaurantName = action.payload.restaurantName;
        }
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.error = action.payload;
        state.loadingStates.userData = false;
        state.user = null;
        toast.error(typeof action.payload === 'string' ? action.payload : 'Failed to fetch user data');
      })
      // Handle fetchRestaurantData
      .addCase(fetchRestaurantData.pending, (state) => {
        state.loadingStates.restaurantData = true;
      })
      .addCase(fetchRestaurantData.fulfilled, (state, action) => {
        state.restaurantDetails = action.payload;
        state.loadingStates.restaurantData = false;
      })
      .addCase(fetchRestaurantData.rejected, (state, action) => {
        state.error = action.payload;
        state.loadingStates.restaurantData = false;
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
        state.loadingStates.persistence = true;
      })
      .addCase(setAuthPersistence.fulfilled, (state, action) => {
        state.rememberMe = action.payload;
        state.loadingStates.persistence = false;
      })
      .addCase(setAuthPersistence.rejected, (state, action) => {
        state.error = action.payload;
        state.loadingStates.persistence = false;
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