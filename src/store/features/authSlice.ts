import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";

// Types
interface User {
  uid: string;
  restaurantName?: string;
  [key: string]: any;
}

interface AuthState {
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
  async (firebaseUser: any) => {
    const refUserDoc = doc(db, "users", firebaseUser.uid);
    const docSnapshot = await getDoc(refUserDoc);
    
    if (docSnapshot.exists()) {
      const userData = { uid: firebaseUser.uid, ...docSnapshot.data() } as User;
      return userData;
    }
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
      state.user = null;
      state.restaurantDetails = undefined;
      state.restaurantName = "";
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

export const { setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer; 