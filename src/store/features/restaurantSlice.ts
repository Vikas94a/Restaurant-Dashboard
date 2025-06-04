import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

// Utility function to convert Firebase Timestamp to ISO string
const convertTimestampToString = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString();
};

// Utility function to convert Firebase data to serializable format
const convertToSerializable = (data: any): any => {
  if (!data) return data;
  
  const result = { ...data };
  
  // Convert Timestamps to ISO strings
  if (result.createdAt instanceof Timestamp) {
    result.createdAt = convertTimestampToString(result.createdAt);
  }
  if (result.updatedAt instanceof Timestamp) {
    result.updatedAt = convertTimestampToString(result.updatedAt);
  }
  
  return result;
};

export interface RestaurantHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface RestaurantDetails {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  openingHours: RestaurantHour[];
  isOpen: boolean;
  timezone: string;
  currency: string;
  taxRate?: number;
  deliveryFee?: number;
  minimumOrder?: number;
  categories?: string[];
  dietaryOptions?: string[];
  paymentMethods?: string[];
}

export interface RestaurantState {
  details: RestaurantDetails | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: RestaurantState = {
  details: null,
  status: 'idle',
  error: null,
};

export const fetchRestaurantDetails = createAsyncThunk(
  'restaurant/fetchDetails',
  async (restaurantId: string) => {
    const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }
    const data = restaurantDoc.data();
    const serializedData = convertToSerializable(data);
    return { id: restaurantId, ...serializedData } as RestaurantDetails;
  }
);

export const updateRestaurantDetails = createAsyncThunk(
  'restaurant/updateDetails',
  async ({ restaurantId, details }: { restaurantId: string; details: Partial<RestaurantDetails> }) => {
    const restaurantRef = doc(db, "restaurants", restaurantId);
    await updateDoc(restaurantRef, details);
    return { id: restaurantId, ...details };
  }
);

export const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    clearRestaurantState: (state) => {
      state.details = null;
      state.status = 'idle';
      state.error = null;
    },
    setRestaurantStatus: (state, action) => {
      state.status = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Restaurant Details
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.details = action.payload;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch restaurant details';
      })
      // Update Restaurant Details
      .addCase(updateRestaurantDetails.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateRestaurantDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.details = { ...state.details, ...action.payload } as RestaurantDetails;
      })
      .addCase(updateRestaurantDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to update restaurant details';
      });
  },
});

export const { clearRestaurantState, setRestaurantStatus } = restaurantSlice.actions;
export default restaurantSlice.reducer;
