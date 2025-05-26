import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";

// Auto-logout timer variable and duration
let autoLogoutTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_LOGOUT_DURATION = 60 * 60 * 1000; // 1 minute in milliseconds for testing

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
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  restaurantDetails: undefined,
  restaurantName: "",
};

// Helper function to convert Timestamp to string
const convertTimestampToString = (timestamp: Timestamp | undefined) => {
  if (!timestamp) return undefined;
  return timestamp.toDate().toISOString();
};

// Async thunks
export const fetchUserData = createAsyncThunk(
  'auth/fetchUserData',
  async (firebaseUser: any, thunkAPI) => {
    console.log('[AutoLogout] fetchUserData called', { hasUser: !!firebaseUser?.uid });

    if (!firebaseUser || !firebaseUser.uid) {
      console.log('[AutoLogout] No user or UID - clearing any existing timer');
      if (autoLogoutTimer) {
        clearTimeout(autoLogoutTimer);
        autoLogoutTimer = null;
      }
      return null;
    }

    // Clear any existing timer when user data is (re)fetched
    if (autoLogoutTimer) {
      console.log('[AutoLogout] Clearing existing timer');
      clearTimeout(autoLogoutTimer);
      autoLogoutTimer = null;
    }

    const refUserDoc = doc(db, "users", firebaseUser.uid);
    const docSnapshot = await getDoc(refUserDoc);

    if (docSnapshot.exists()) {
      const userData = { uid: firebaseUser.uid, ...docSnapshot.data() } as User;

      // Start the auto-logout timer if user data is successfully fetched
      console.log(`[AutoLogout] Setting new auto-logout timer for ${AUTO_LOGOUT_DURATION / 1000 / 60} minutes`);

      autoLogoutTimer = setTimeout(() => {
        console.log('[AutoLogout] Auto-logout timer triggered - dispatching logout');
        // First dispatch logout to clear all user data
        thunkAPI.dispatch(logout());
      }, AUTO_LOGOUT_DURATION);

      logTimerStatus('New timer set');
      return userData;
    }

    console.log('[AutoLogout] User document not found - no timer set');
    return null;
  }
);

export const fetchRestaurantData = createAsyncThunk(
  'auth/fetchRestaurantData',
  async (userId: string) => {
    const q = query(collection(db, "restaurants"), where("ownerId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const restaurantDoc = querySnapshot.docs[0];
      const restaurantData = restaurantDoc.data() as Restaurant;
      restaurantData.restaurantId = restaurantDoc.id;

      // Convert Timestamps to strings
      const createdAt = restaurantData.createdAt as unknown as Timestamp;
      const updatedAt = restaurantData.updatedAt as unknown as Timestamp;

      if (createdAt && typeof createdAt.toDate === 'function') {
        restaurantData.createdAt = convertTimestampToString(createdAt);
      }
      if (updatedAt && typeof updatedAt.toDate === 'function') {
        restaurantData.updatedAt = convertTimestampToString(updatedAt);
      }

      return restaurantData;
    }
    return undefined;
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
      if (isLoggingOut) return; // Prevent multiple logout attempts
      isLoggingOut = true;

      console.log('[AutoLogout] Logout action triggered');

      // Clear any pending timers
      if (autoLogoutTimer) {
        console.log('[AutoLogout] Clearing auto-logout timer on logout');
        clearTimeout(autoLogoutTimer);
        autoLogoutTimer = null;
      }


      // Clear Firebase auth state
      import('firebase/auth').then(({ signOut }) => {
        signOut(auth).catch(console.error);
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


        } catch (e) {
          console.error('Error during logout cleanup:', e);
        } finally {
          isLoggingOut = false;
        }
      };

      // Execute cleanup
      clearAuthData();
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchUserData
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        if (action.payload?.restaurantName) {
          state.restaurantName = action.payload.restaurantName;
        }
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.error = action.error;
        state.loading = false;
        state.user = null;
      })
      // Handle fetchRestaurantData
      .addCase(fetchRestaurantData.fulfilled, (state, action) => {
        state.restaurantDetails = action.payload;
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
          return;
        }
      }

      if (user) {
        // Only proceed with login if we're not in the middle of logging out
        if (!isLoggingOut) {
          dispatch(fetchUserData(user))
            .unwrap()
            .then((userData: any) => {
              if (userData && !isLoggingOut) {
                dispatch(fetchRestaurantData(userData.uid));
              }
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

export const { setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer; 