import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface RestaurantState {
  hours: any[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: RestaurantState = {
  hours: [],
  status: 'idle',
  error: null,
};

export const fetchRestaurantHours = createAsyncThunk(
  'restaurant/fetchHours',
  async (restaurantId: string) => {
    const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }
    return restaurantDoc.data().openingHours || [];
  }
);

export const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurantHours.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRestaurantHours.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.hours = action.payload;
      })
      .addCase(fetchRestaurantHours.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch restaurant hours';
      });
  },
});

export default restaurantSlice.reducer;
