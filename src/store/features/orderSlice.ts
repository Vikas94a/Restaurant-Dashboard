import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, doc, updateDoc, onSnapshot, QuerySnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/checkout';
import { CartItem } from '@/types/cart';
import { sendOrderConfirmationEmail, sendOrderRejectionEmail } from '@/services/email/emailService';

// Types
export interface OrderState {
  orders: Order[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  status: 'idle',
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
  'orders/create',
  async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const orderRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create a new order with all required fields
    const newOrder: Order = {
      id: orderRef.id,
      status: 'pending',
      customerDetails: orderData.customerDetails,
      items: orderData.items,
      total: orderData.total,
      pickupTime: orderData.pickupTime,
      restaurantId: orderData.restaurantId,
      pickupOption: orderData.pickupOption,
      estimatedPickupTime: orderData.estimatedPickupTime,
      createdAt: new Date().toISOString(),
    };

    return newOrder;
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
      
      // Get the updated order data
      const orderDoc = await getDoc(orderRef);
      const orderData = orderDoc.data() as Order;

      // Send appropriate email based on status
      if (newStatus === 'accepted') {
        await sendOrderConfirmationEmail(orderData);
      } else if (newStatus === 'rejected') {
        await sendOrderRejectionEmail(orderData);
      }
      
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
            restaurantId: data.restaurantId,
            customerDetails: data.customerDetails,
            items: Array.isArray(data.items) ? data.items as CartItem[] : [],
            total: data.total,
            status: data.status,
            createdAt: createdAt,
            pickupTime: data.pickupTime,
            pickupOption: data.pickupOption,
            estimatedPickupTime: data.estimatedPickupTime || null,
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

export const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
      state.status = 'succeeded';
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.status = action.payload ? 'loading' : 'idle';
      state.error = null;
    },
    setOrdersError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = 'failed';
    },
    clearOrders: (state) => {
      state.orders = [];
      state.error = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.status = 'succeeded';
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.status = 'failed';
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

export const { setOrders, setLoading, setOrdersError, clearOrders } = orderSlice.actions;
export default orderSlice.reducer; 