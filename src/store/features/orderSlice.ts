import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { collection, addDoc, query, orderBy, doc, updateDoc, onSnapshot, QuerySnapshot, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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

// Helper function to convert Firestore Timestamp (or compatible values) to string
const convertTimestampToString = (
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | string | undefined
): string => {
  if (!timestamp) return '';
  // Already a string (e.g., ISO stored by older writes)
  if (typeof timestamp === 'string') return timestamp;
  // Firestore Timestamp instance
  if (typeof (timestamp as Timestamp).toDate === 'function') {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  // Firestore timestamp object as plain data
  if (typeof (timestamp as { seconds: number; nanoseconds: number }).seconds === 'number') {
    const date = new Date((timestamp as { seconds: number; nanoseconds: number }).seconds * 1000);
    return date.toISOString();
  }
  return '';
};

type BackendOrderStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
type UIOrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

function backendToUIStatus(status: BackendOrderStatus): UIOrderStatus {
  switch (status) {
    case 'accepted':
      return 'confirmed';
    case 'rejected':
      return 'cancelled';
    default:
      return status;
  }
}

// Async thunks
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Set auto-cancel timer for ASAP orders (3 minutes from now)
    const autoCancelAt = orderData.pickupOption === 'asap' 
      ? new Date(Date.now() + 3 * 60 * 1000).toISOString() 
      : undefined;

    const orderRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      autoCancelAt
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
      updatedAt: new Date().toISOString(),
      completedAt: null,
      autoCancelAt
    };

    return newOrder;
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, restaurantId, newStatus, estimatedPickupTime, cancellationReason }: {
    orderId: string;
    restaurantId: string;
    newStatus: BackendOrderStatus;
    estimatedPickupTime?: string;
    cancellationReason?: string;
  }) => {
    try {
      const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(estimatedPickupTime && { estimatedPickupTime }),
        ...(cancellationReason && { cancellationReason }),
        ...(newStatus === 'completed' && { completedAt: serverTimestamp() })
      };

      // Send confirmation email when order is accepted
      if (newStatus === 'accepted') {
        const order = { id: orderId, ...orderData } as Order;
        try {
          await sendOrderConfirmationEmail(order);
          } catch (emailError) {
          }
      }

      // Send rejection email when order is rejected
      if (newStatus === 'rejected') {
        const order = { id: orderId, ...orderData, cancellationReason } as Order;
        try {
          await sendOrderRejectionEmail(order);
          } catch (emailError) {
          }
      }

      await updateDoc(orderRef, updateData);
      return { orderId, newStatus, estimatedPickupTime };
    } catch (error) {
      throw error;
    }
  }
);

// Auto-cancel ASAP orders that have exceeded the 3-minute timer
export const autoCancelExpiredOrder = createAsyncThunk(
  'orders/autoCancel',
  async ({ orderId, restaurantId }: {
    orderId: string;
    restaurantId: string;
  }) => {
    try {
      const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      
      // Send automatic rejection email
      const order = { id: orderId, ...orderData, cancellationReason: 'Restaurant is busy - unable to process your order at this time' } as Order;
      try {
        await sendOrderRejectionEmail(order);
      } catch (emailError) {
        console.error('Failed to send auto-cancel email:', emailError);
      }

      // Update order status to rejected
      const updateData = {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        cancellationReason: 'Restaurant is busy - unable to process your order at this time'
      };

      await updateDoc(orderRef, updateData);
      return { orderId };
    } catch (error) {
      throw error;
    }
  }
);

// Custom thunk to set up real-time listener for restaurant orders
export const subscribeToRestaurantOrders = (restaurantId: string) => (dispatch: (action: PayloadAction<Order[] | boolean | string | null>) => void) => {
   if (!restaurantId) {
        dispatch(setOrdersError('Restaurant ID not available.'));
        return () => {};
    }

    dispatch(setLoading(true));

    const ordersCollectionRef = collection(db, 'restaurants', restaurantId, 'orders');
    const q = query(ordersCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Convert Timestamp fields to strings for Redux state serializability
          const createdAt = data.createdAt ? convertTimestampToString(data.createdAt) : '';

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
      (error: Error) => {
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
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const { orderId, newStatus, estimatedPickupTime } = action.payload;
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
          order.status = backendToUIStatus(newStatus);
          if (estimatedPickupTime) {
            order.estimatedPickupTime = estimatedPickupTime;
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