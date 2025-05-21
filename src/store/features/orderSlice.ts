import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, doc, updateDoc, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  pickupTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  estimatedPickupTime?: string | null;
}

export interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  loading: false,
  error: null,
};

// Helper function to convert Firestore Timestamp to string
const convertTimestampToString = (timestamp: Timestamp | { seconds: number, nanoseconds: number } | undefined): string => {
  if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
    return (timestamp as Timestamp).toDate().toLocaleString();
  } else if (timestamp && typeof (timestamp as { seconds: number, nanoseconds: number }).seconds === 'number') {
     const date = new Date((timestamp as { seconds: number, nanoseconds: number }).seconds * 1000);
     return date.toLocaleString();
  }
  return '';
};

// Async thunks
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const orderRef = collection(db, `restaurants/${orderData.restaurantId}/orders`);
      const newOrder = {
        ...orderData,
        status: 'pending' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(orderRef, newOrder);
      return { 
        id: docRef.id, 
        ...newOrder,
        createdAt: newOrder.createdAt.toDate().toISOString(),
        updatedAt: newOrder.updatedAt.toDate().toISOString(),
      } as Order;
    } catch (error: any) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, restaurantId, newStatus, estimatedPickupTime }: 
  { orderId: string; restaurantId: string; newStatus: 'accepted' | 'rejected' | 'completed'; estimatedPickupTime?: string | null }) => {
    try {
      const orderRef = doc(db, `restaurants/${restaurantId}/orders`, orderId);
      
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };

      // Only add estimatedPickupTime if status is accepted and a value is provided
      if (newStatus === 'accepted' && estimatedPickupTime !== undefined) {
         updateData.estimatedPickupTime = estimatedPickupTime;
      }

      await updateDoc(orderRef, updateData);
      
      // Return serializable data, including the estimated time if set
      return { orderId, newStatus, estimatedPickupTime: newStatus === 'accepted' ? estimatedPickupTime : undefined };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
);

// Custom thunk to set up real-time listener for restaurant orders
export const subscribeToRestaurantOrders = (restaurantId: string) => (dispatch: any) => {
   if (!restaurantId) {
        console.error('Restaurant ID is required to subscribe to orders.');
        dispatch(setOrdersError('Restaurant ID not available.'));
        return () => {};
    }

    console.log(`Attempting to subscribe to orders for Restaurant ID: ${restaurantId}`);
    dispatch(setLoading(true));

    const ordersCollectionRef = collection(db, 'restaurants', restaurantId, 'orders');
    const q = query(ordersCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        console.log('Real-time update received for orders.');
        const ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Convert Timestamp fields to strings for Redux state serializability
          const createdAt = data.createdAt ? convertTimestampToString(data.createdAt) : '';
          const updatedAt = data.updatedAt ? convertTimestampToString(data.updatedAt) : '';

          return {
            id: doc.id,
            ...data,
            createdAt: createdAt,
            updatedAt: updatedAt,
            items: Array.isArray(data.items) ? data.items as OrderItem[] : [],
            estimatedPickupTime: data.estimatedPickupTime || undefined,
          } as Order;
        });
        // Dispatch action to update orders in the state
        dispatch(setOrders(ordersList));
      },
      (error: any) => {
        console.error('Error fetching real-time orders:', error);
        dispatch(setOrdersError(error.message || 'Failed to fetch real-time orders'));
      }
    );

    return unsubscribe;
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
       state.loading = action.payload;
       state.error = null;
    },
    setOrdersError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create order';
      })
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action: PayloadAction<{ orderId: string; newStatus: string; estimatedPickupTime?: string | null }>) => {
        const order = state.orders.find(o => o.id === action.payload.orderId);
        if (order) {
          order.status = action.payload.newStatus as Order['status'];
          if (action.payload.estimatedPickupTime !== undefined) {
            order.estimatedPickupTime = action.payload.estimatedPickupTime;
          }
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update order status';
      });
  },
});

export const { setOrders, setOrdersError, clearOrders, setLoading } = orderSlice.actions;
export default orderSlice.reducer; 