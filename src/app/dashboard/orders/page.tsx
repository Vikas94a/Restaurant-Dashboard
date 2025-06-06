"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  subscribeToRestaurantOrders,
  Order,
  OrderItem,
  updateOrderStatus,
  clearOrders,
} from "@/store/features/orderSlice";
import { LoadingSpinner } from "@/components/dashboardcomponent/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, restaurantDetails } = useAppSelector(
    (state: RootState) => state.auth
  );
  const ordersState = useAppSelector((state: RootState) => state.orders);
  const { orders = [], loading = false, error = null } = ordersState || {};
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, string>>(
    {}
  );

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
      dispatch({
        type: "orders/setOrdersError",
        payload: "Restaurant details not found.",
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
      dispatch(clearOrders());
    };
  }, [dispatch, restaurantDetails?.restaurantId, user, router]);

  useEffect(() => {
    const newPendingOrders = orders.filter(
      (order) => order.status === "pending" && !(order.id in estimatedTimes)
    );
    if (newPendingOrders.length > 0) {
      const newEstimatedTimes = { ...estimatedTimes };
      newPendingOrders.forEach((order) => {
        newEstimatedTimes[order.id] = "";
      });
      setEstimatedTimes(newEstimatedTimes);
    }
  }, [orders]);

  const handleOrderStatus = async (
    orderId: string,
    newStatus: "accepted" | "rejected" | "completed"
  ) => {
    try {
      if (!restaurantDetails?.restaurantId) {
        toast.error("Restaurant ID not found");
        return;
      }

      const estimatedPickupTime =
        newStatus === "accepted" ? estimatedTimes[orderId] : undefined;

      if (
        newStatus === "accepted" &&
        (!estimatedPickupTime || estimatedPickupTime.trim() === "")
      ) {
        toast.error("Please provide an estimated pickup time.");
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
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handleEstimatedTimeChange = (orderId: string, time: string) => {
    setEstimatedTimes((prev) => ({ ...prev, [orderId]: time }));
  };

  if (loading && orders.length === 0) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white rounded shadow p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Orders
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
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
              {loading && orders.length > 0 && (
                <span className="text-sm text-gray-500 flex items-center">
                  <LoadingSpinner />
                  Updating orders...
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {orders.length === 0 && !loading && !error ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-200">
            <img
              src="/empty-orders.svg"
              alt="No orders"
              className="w-32 h-32 mb-4 opacity-50"
            />
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
    status: "accepted" | "rejected" | "completed"
  ) => void;
}

function OrderCard({
  order,
  estimatedTime,
  onEstimatedTimeChange,
  onStatusChange,
}: OrderCardProps) {
  const statusColors = {
    pending: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100/50",
    accepted: "bg-green-50 border-green-200 hover:bg-green-100/50",
    rejected: "bg-red-50 border-red-200 hover:bg-red-100/50",
    completed: "bg-blue-50 border-blue-200 hover:bg-blue-100/50",
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-200 ${
        statusColors[order.status]
      }`}
    >
      {/* Order Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            #{order.id.slice(-6)}
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                order.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : order.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </h3>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-2">Customer:</span>
              {order.customerName}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-2">Phone:</span>
              {order.customerPhone}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <div className="bg-white/50 rounded-md p-3 space-y-2">
          {order.items.map((item: OrderItem, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 flex items-center">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded mr-2">
                  {item.quantity}x
                </span>
                {item.itemName}
              </span>
              <span className="text-gray-900 font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-semibold text-gray-900">
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Pickup Time */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-gray-600 flex items-center">
          <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400" />
          Pickup: {order.pickupTime}
        </span>
      </div>

      {/* Action Buttons */}
      {order.status === "pending" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Estimated preparation time (e.g. 20-30 mins)"
            value={estimatedTime || ""}
            onChange={(e) => onEstimatedTimeChange(order.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(order.id, "accepted")}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Accept
            </button>
            <button
              onClick={() => onStatusChange(order.id, "rejected")}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="mr-2" />
              Reject
            </button>
          </div>
        </div>
      )}

      {order.status === "accepted" && (
        <div className="space-y-3">
          {order.estimatedPickupTime ? (
            <p className="text-sm text-green-700 font-medium flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2" />
              Ready in: {order.estimatedPickupTime}
            </p>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No estimated pickup time provided
            </p>
          )}
          <button
            onClick={() => onStatusChange(order.id, "completed")}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Mark as Completed
          </button>
        </div>
      )}
    </div>
  );
}
