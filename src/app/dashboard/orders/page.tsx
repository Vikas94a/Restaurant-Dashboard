"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  subscribeToRestaurantOrders,
  updateOrderStatus,
  clearOrders,
  setOrders,
} from "@/store/features/orderSlice";
import { Order } from '@/types/checkout';
import { CartItem as OrderItem } from '@/types/cart';
import { LoadingSpinner } from "@/components/dashboardcomponent/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

type UIOrderStatus = "confirmed" | "cancelled" | "completed";
type BackendOrderStatus = "accepted" | "rejected" | "completed";

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, restaurantDetails } = useAppSelector(
    (state: RootState) => state.auth
  );
  const { orders, status } = useAppSelector((state: RootState) => state.orders);
  const [loading, setLoading] = useState(true);
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (!user) {
      toast.error("Please sign in to view orders");
      router.replace("/login");
      return;
    }

    if (restaurantDetails?.restaurantId) {
      unsubscribe = dispatch(
        subscribeToRestaurantOrders(restaurantDetails.restaurantId)
      );
    } else {
      dispatch(clearOrders());
    }

    return () => {
      if (unsubscribe) unsubscribe();
      dispatch(clearOrders());
    };
  }, [dispatch, restaurantDetails?.restaurantId, user, router]);

  useEffect(() => {
    if (!restaurantDetails?.restaurantId) {
      setLoading(false);
      return;
    }

    const ordersRef = collection(db, 'restaurants', restaurantDetails.restaurantId, 'orders');
    const q = query(ordersRef, where('restaurantId', '==', restaurantDetails.restaurantId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Timestamp fields to strings
        const convertTimestamp = (timestamp: any) => {
          if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toISOString();
          }
          return null;
        };

        return {
          id: doc.id,
          restaurantId: data.restaurantId,
          customerDetails: data.customerDetails,
          items: data.items || [],
          total: data.total,
          status: data.status,
          pickupTime: data.pickupTime,
          pickupOption: data.pickupOption,
          estimatedPickupTime: data.estimatedPickupTime,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          completedAt: convertTimestamp(data.completedAt)
        } as Order;
      });
      dispatch(clearOrders());
      dispatch(setOrders(ordersData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch, restaurantDetails?.restaurantId]);

  const handleOrderStatus = async (
    orderId: string,
    newStatus: BackendOrderStatus
  ) => {
    try {
      if (!restaurantDetails?.restaurantId) {
        toast.error("Restaurant ID not found");
        return;
      }

      const order = orders.find(o => o.id === orderId);
      const isAsapOrder = order?.pickupOption === 'asap';
      const estimatedPickupTime = isAsapOrder && newStatus === "accepted" ? estimatedTimes[orderId] : undefined;

      if (isAsapOrder && newStatus === "accepted" && (!estimatedPickupTime || estimatedPickupTime.trim() === "")) {
        toast.error("Please provide an estimated pickup time for ASAP orders.");
        return;
      }

      await dispatch(
        updateOrderStatus({
          orderId,
          restaurantId: restaurantDetails.restaurantId,
          newStatus,
          estimatedPickupTime: estimatedPickupTime?.trim(),
        })
      ).unwrap();

      // Show success message based on the action
      if (newStatus === 'accepted') {
        toast.success(`Order accepted! Customer has been notified via email.`);
      } else if (newStatus === 'rejected') {
        toast.success(`Order rejected! Customer has been notified via email.`);
      } else if (newStatus === 'completed') {
        toast.success(`Order marked as completed!`);
      }
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleEstimatedTimeChange = (orderId: string, time: string) => {
    setEstimatedTimes((prev) => ({ ...prev, [orderId]: time }));
  };

  // Test email functionality
  const testEmail = async () => {
    try {
      const testOrder = orders[0]; // Use the first order as a test
      if (!testOrder) {
        toast.error("No orders available for testing");
        return;
      }

      console.log('🧪 Testing email functionality with order:', testOrder.id);
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testOrder.customerDetails.email,
          subject: 'Test Email - AI Eat Easy',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Test Email</h2>
              <p>This is a test email to verify the email functionality is working.</p>
              <p>Order ID: ${testOrder.id}</p>
              <p>Customer: ${testOrder.customerDetails.name}</p>
            </div>
          `
        }),
      });

      const data = await response.json();
      console.log('🧪 Test email response:', data);

      if (response.ok) {
        toast.success("Test email sent successfully! Check the console for details.");
      } else {
        toast.error(`Test email failed: ${data.error}`);
      }
    } catch (error) {
      console.error('🧪 Test email error:', error);
      toast.error("Test email failed. Check console for details.");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!restaurantDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white rounded shadow p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Restaurant Found
          </h2>
          <p className="text-gray-600 mb-4">
            Please set up your restaurant details first.
          </p>
          <button
            onClick={() => router.push("/dashboard/setup")}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          >
            Go to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Order Management
            </h1>
            <div className="flex items-center space-x-4">
              {status === 'loading' && orders.length > 0 && (
                <span className="text-sm text-gray-500 flex items-center">
                  <LoadingSpinner />
                  Updating orders...
                </span>
              )}
              <button
                onClick={testEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Test Email
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {orders.length === 0 && status !== 'loading' ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700">
              No Active Orders
            </h3>
            <p className="text-gray-500 mt-2">New orders will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order: Order) => (
              <OrderCard
                key={order.id}
                order={order}
                estimatedTime={estimatedTimes[order.id]}
                onEstimatedTimeChange={handleEstimatedTimeChange}
                onStatusChange={handleOrderStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  estimatedTime: string;
  onEstimatedTimeChange: (orderId: string, time: string) => void;
  onStatusChange: (
    orderId: string,
    status: BackendOrderStatus
  ) => void;
}

function OrderCard({
  order,
  estimatedTime,
  onEstimatedTimeChange,
  onStatusChange,
}: OrderCardProps): React.ReactElement {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100/50",
    confirmed: "bg-green-50 border-green-200 hover:bg-green-100/50",
    cancelled: "bg-red-50 border-red-200 hover:bg-red-100/50",
    completed: "bg-blue-50 border-blue-200 hover:bg-blue-100/50",
    ready: "bg-blue-50 border-blue-200 hover:bg-blue-100/50",
  };

  // Map backend status to UI status
  const backendToUIStatus = (status: string): UIOrderStatus | 'pending' | 'ready' => {
    if (status === 'accepted') return 'confirmed';
    if (status === 'rejected') return 'cancelled';
    return status as UIOrderStatus | 'pending' | 'ready';
  };
  // Map UI status to backend status
  const uiToBackendStatus = (status: UIOrderStatus): BackendOrderStatus => {
    if (status === 'confirmed') return 'accepted';
    if (status === 'cancelled') return 'rejected';
    return 'completed';
  };

  const uiStatus = backendToUIStatus(order.status);
  const isAsapOrder = order.pickupOption === 'asap';

  const formatPickupTime = () => {
    if (isAsapOrder) return 'ASAP';
    
    const pickupDate = new Date(order.customerDetails.pickupDate);
    const today = new Date();
    const isToday = pickupDate.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today at ${order.pickupTime}`;
    } else {
      const day = pickupDate.getDate();
      const weekday = pickupDate.toLocaleDateString('en-US', { weekday: 'long' });
      return `${day} ${weekday} at ${order.pickupTime}`;
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-200 ${
        statusColors[uiStatus]
      }`}
    >
      {/* Order Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            #{order.id.slice(-6)}
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                uiStatus === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : uiStatus === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : uiStatus === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {uiStatus.charAt(0).toUpperCase() + uiStatus.slice(1)}
            </span>
          </h3>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-2">Name:</span>
              {order.customerDetails?.name}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-2">Phone:</span>
              {order.customerDetails?.phone}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-2">Email:</span>
              {order.customerDetails?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <div className="bg-white/50 rounded-md p-3 space-y-2">
          {order.items.map((item: OrderItem, i: number) => (
            <div key={i} className="py-2 border-b border-gray-100 last:border-none">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700 flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded mr-2">
                    {item.quantity}x
                  </span>
                  {item.itemName}
                </span>
                <span className="text-gray-900 font-medium">
                  {(item.itemPrice * item.quantity).toFixed(2)} kr
                </span>
              </div>
              {/* Customizations/Extras */}
              {item.customizations && item.customizations.length > 0 && (
                <div className="ml-2 mt-1 text-xs text-gray-600 space-y-1">
                  {item.customizations.map((customization) => (
                    <div key={customization.category} className="flex flex-wrap gap-1.5">
                      <span className="font-medium text-gray-700">{customization.category}:</span>
                      {customization.options.length === 0 ? (
                        <span className="text-gray-400 italic">None</span>
                      ) : (
                        customization.options.map((option) => (
                          <span
                            key={option.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                          >
                            {option.name}
                            {option.price > 0 && (
                              <span className="text-primary ml-1 font-medium">+{option.price.toFixed(2)} kr</span>
                            )}
                          </span>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Special Request */}
              {item.specialInstructions && item.specialInstructions.text && (
                <div className="ml-2 mt-1 text-xs text-gray-700">
                  <span className="font-medium">Special Request:</span> <span className="italic text-gray-600">{item.specialInstructions.text}</span>
                </div>
              )}
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-semibold text-gray-900">
              {order.total.toFixed(2)} kr
            </span>
          </div>
        </div>
      </div>

      {/* Pickup Time */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-gray-600 flex items-center">
          <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400" />
          Pickup: {formatPickupTime()}
        </span>
      </div>

      {/* Action Buttons */}
      {uiStatus === "pending" && (
        <div className="space-y-3">
          {isAsapOrder && (
            <input
              type="text"
              placeholder="Estimated preparation time (e.g. 20-30 mins)"
              value={estimatedTime || ""}
              onChange={(e) => onEstimatedTimeChange(order.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(order.id, uiToBackendStatus("confirmed"))}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Accept
            </button>
            <button
              onClick={() => onStatusChange(order.id, uiToBackendStatus("cancelled"))}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="mr-2" />
              Reject
            </button>
          </div>
        </div>
      )}

      {uiStatus === "confirmed" && (
        <div className="space-y-3">
          {isAsapOrder && order.estimatedPickupTime ? (
            <p className="text-sm text-green-700 font-medium flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2" />
              Ready in: {order.estimatedPickupTime}
            </p>
          ) : null}
          <button
            onClick={() => onStatusChange(order.id, uiToBackendStatus("completed"))}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Mark as Completed
          </button>
        </div>
      )}
    </div>
  );
}
