"use client";

import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updateOrderStatus,
  autoCancelExpiredOrder,
} from "@/store/features/orderSlice";
import { Order } from '@/types/checkout';
import { CartItem as OrderItem } from '@/types/cart';
import { LoadingSpinner } from "@/components/dashboardcomponent/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCheck, faXmark, faReceipt, faExclamationTriangle, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { useSoundNotification } from "@/providers/SoundNotificationProvider";
import OrderNavBar from '@/components/Orders/OrderNavBar';
import OrderList from '@/components/Orders/OrderList';

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
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'rejected'>('active');
  const [cancellationReasons, setCancellationReasons] = useState<Record<string, string>>({});
  const [asapTimers, setAsapTimers] = useState<Record<string, { timeLeft: number; interval: NodeJS.Timeout }>>({});
  const [preparationTimers, setPreparationTimers] = useState<Record<string, { timeLeft: number; interval: NodeJS.Timeout }>>({});
  const timerRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const prepTimerRefs = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Use global sound notification
  const { SoundControls, stopRepeatingSound, debugAudio } = useSoundNotification();

  // Timer management for ASAP orders
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    // Start timers for pending ASAP orders
    orders.forEach(order => {
      if (order.pickupOption === 'asap' && order.status === 'pending') {
        // Calculate time left from autoCancelAt or create one if missing
        let autoCancelTime: number;
        if (order.autoCancelAt) {
          autoCancelTime = new Date(order.autoCancelAt).getTime();
        } else {
          // If no autoCancelAt, set it to 3 minutes from order creation
          autoCancelTime = new Date(order.createdAt).getTime() + (3 * 60 * 1000);
        }
        
        const now = Date.now();
        const timeLeft = Math.max(0, autoCancelTime - now);

        if (timeLeft > 0 && !timerRefs.current[order.id]) {
          const interval = setInterval(() => {
            setAsapTimers(prev => {
              const currentTimer = prev[order.id];
              if (!currentTimer) return prev;

              const newTimeLeft = Math.max(0, currentTimer.timeLeft - 1000);
              
              if (newTimeLeft === 0) {
                // Auto-cancel the order
                if (restaurantDetails?.restaurantId) {
                  dispatch(autoCancelExpiredOrder({
                    orderId: order.id,
                    restaurantId: restaurantDetails.restaurantId
                  }));
                }
                // Clear timer from refs
                if (timerRefs.current[order.id]) {
                  clearInterval(timerRefs.current[order.id]);
                  delete timerRefs.current[order.id];
                }
                // Remove from state
                const newTimers = { ...prev };
                delete newTimers[order.id];
                return newTimers;
              }

              return {
                ...prev,
                [order.id]: {
                  ...currentTimer,
                  timeLeft: newTimeLeft
                }
              };
            });
          }, 1000);

          // Store interval in refs
          timerRefs.current[order.id] = interval;

          setAsapTimers(prev => ({
            ...prev,
            [order.id]: {
              timeLeft,
              interval
            }
          }));
        }
      }
    });

    // Cleanup timers for orders that are no longer pending ASAP
    Object.keys(timerRefs.current).forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (!order || order.status !== 'pending' || order.pickupOption !== 'asap') {
        clearInterval(timerRefs.current[orderId]);
        delete timerRefs.current[orderId];
        setAsapTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[orderId];
          return newTimers;
        });
      }
    });
  }, [orders, restaurantDetails?.restaurantId, dispatch]);

  // Preparation timer management for accepted ASAP orders
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    // Start preparation timers for accepted ASAP orders with estimated pickup time
    orders.forEach(order => {
      if (order.pickupOption === 'asap' && order.status === 'confirmed' && order.estimatedPickupTime) {
        // Parse the estimated pickup time (e.g., "20-30 minutter" or "25 minutter")
        const timeMatch = order.estimatedPickupTime.match(/(\d+)/);
        if (timeMatch) {
          const prepTimeMinutes = parseInt(timeMatch[1]);
          const prepTimeMs = prepTimeMinutes * 60 * 1000;
          
          // Calculate when the order was accepted (use updatedAt if available, otherwise createdAt + some buffer)
          const acceptedTime = order.updatedAt ? new Date(order.updatedAt).getTime() : new Date(order.createdAt).getTime();
          const now = Date.now();
          const timeElapsed = now - acceptedTime;
          const timeLeft = Math.max(0, prepTimeMs - timeElapsed);

          if (timeLeft > 0 && !prepTimerRefs.current[order.id]) {
            const interval = setInterval(() => {
              setPreparationTimers(prev => {
                const currentTimer = prev[order.id];
                if (!currentTimer) return prev;

                const newTimeLeft = Math.max(0, currentTimer.timeLeft - 1000);
                
                if (newTimeLeft === 0) {
                  // Order is ready
                  // Clear timer from refs
                  if (prepTimerRefs.current[order.id]) {
                    clearInterval(prepTimerRefs.current[order.id]);
                    delete prepTimerRefs.current[order.id];
                  }
                  // Remove from state
                  const newTimers = { ...prev };
                  delete newTimers[order.id];
                  return newTimers;
                }

                return {
                  ...prev,
                  [order.id]: {
                    ...currentTimer,
                    timeLeft: newTimeLeft
                  }
                };
              });
            }, 1000);

            // Store interval in refs
            prepTimerRefs.current[order.id] = interval;

            setPreparationTimers(prev => ({
              ...prev,
              [order.id]: {
                timeLeft,
                interval
              }
            }));
          }
        }
      }
    });

    // Cleanup preparation timers for orders that are no longer relevant
    Object.keys(prepTimerRefs.current).forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (!order || order.status !== 'confirmed' || !order.estimatedPickupTime) {
        clearInterval(prepTimerRefs.current[orderId]);
        delete prepTimerRefs.current[orderId];
        setPreparationTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[orderId];
          return newTimers;
        });
      }
    });
  }, [orders]);

  // Cleanup effect for timers
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(interval => {
        clearInterval(interval);
      });
      Object.values(prepTimerRefs.current).forEach(interval => {
        clearInterval(interval);
      });
      timerRefs.current = {};
      prepTimerRefs.current = {};
    };
  }, []);

  useEffect(() => {
    if (!user) {
      toast.error("Vennligst logg inn for å se bestillinger");
      router.replace("/login");
      return;
    }

    if (restaurantDetails?.restaurantId) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [restaurantDetails?.restaurantId, user, router]);

  const handleOrderStatus = async (
    orderId: string,
    newStatus: BackendOrderStatus,
    cancellationReason?: string
  ) => {
    try {
      if (!restaurantDetails?.restaurantId) {
        toast.error("Restaurant-ID ikke funnet");
        return;
      }

      const order = orders.find(o => o.id === orderId);
      const isAsapOrder = order?.pickupOption === 'asap';
      const estimatedPickupTime = isAsapOrder && newStatus === "accepted" ? estimatedTimes[orderId] : undefined;

      if (isAsapOrder && newStatus === "accepted" && (!estimatedPickupTime || estimatedPickupTime.trim() === "")) {
        toast.error("Vennligst oppgi estimert hentetid for ASAP-bestillinger.");
        return;
      }

      // Validate cancellation reason for rejected orders
      if (newStatus === 'rejected' && (!cancellationReason || cancellationReason.trim() === "")) {
        toast.error("Vennligst velg en årsak for avvisning.");
        return;
      }

      await dispatch(
        updateOrderStatus({
          orderId,
          restaurantId: restaurantDetails.restaurantId,
          newStatus,
          estimatedPickupTime: estimatedPickupTime?.trim(),
          cancellationReason: cancellationReason?.trim(),
        })
      ).unwrap();

      // Clear timer for ASAP orders when processed
      if (isAsapOrder && timerRefs.current[orderId]) {
        clearInterval(timerRefs.current[orderId]);
        delete timerRefs.current[orderId];
        setAsapTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[orderId];
          return newTimers;
        });
      }

      // Stop sound when order is processed
      if (newStatus === 'accepted' || newStatus === 'rejected') {
        stopRepeatingSound();
      }

      // Clear cancellation reason after successful rejection
      if (newStatus === 'rejected') {
        setCancellationReasons(prev => {
          const newReasons = { ...prev };
          delete newReasons[orderId];
          return newReasons;
        });
      }

      // Show success message based on the action
      if (newStatus === 'accepted') {
        toast.success(`Bestilling akseptert! Kunden har blitt varslet via e-post.`);
      } else if (newStatus === 'rejected') {
        toast.success(`Bestilling avvist! Kunden har blitt varslet via e-post.`);
      } else if (newStatus === 'completed') {
        toast.success(`Bestilling markert som fullført!`);
      }
    } catch {
      toast.error("Kunne ikke oppdatere bestillingsstatus");
    }
  };

  const handleEstimatedTimeChange = (orderId: string, time: string) => {
    setEstimatedTimes((prev) => ({ ...prev, [orderId]: time }));
  };

  const handleCancellationReasonChange = (orderId: string, reason: string) => {
    setCancellationReasons((prev) => ({ ...prev, [orderId]: reason }));
  };

  // Helper function to format time left
  const formatTimeLeft = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Laster bestillinger...</p>
        </div>
      </div>
    );
  }

  if (!restaurantDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Ingen restaurant funnet
          </h2>
          <p className="text-gray-600 mb-6">
            Vennligst konfigurer restaurantdetaljene dine først.
          </p>
          <button
            onClick={() => router.push("/dashboard/setup")}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Gå til oppsett
          </button>
        </div>
      </div>
    );
  }

  // Split orders into active, completed, and rejected
  const activeOrders = orders.filter(
    (order: Order) => (order.status as string) !== 'completed' && (order.status as string) !== 'rejected'
  );
  const completedOrders = orders.filter(
    (order: Order) => (order.status as string) === 'completed'
  );
  const rejectedOrders = orders.filter(
    (order: Order) => (order.status as string) === 'rejected'
  );

  let displayedOrders = activeOrders;
  if (selectedTab === 'completed') displayedOrders = completedOrders;
  if (selectedTab === 'rejected') displayedOrders = rejectedOrders;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faReceipt} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bestillingshåndtering
                </h1>
                <p className="text-gray-600 mt-1">
                  Administrer og spore alle bestillinger
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Global Sound Controls */}
              <SoundControls />

              {/* Debug Button */}
              <button
                onClick={debugAudio}
                className="p-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all duration-200"
                title="Debug Audio"
              >
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
              </button>

              {status === 'loading' && orders.length > 0 && (
                <div className="flex items-center bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
                  <LoadingSpinner />
                  <span className="ml-2 text-sm font-medium">Oppdaterer bestillinger...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faClock} className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Aktive bestillinger</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fullførte bestillinger</p>
                <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avviste bestillinger</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        <OrderNavBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
        <OrderList
          orders={displayedOrders}
          estimatedTimes={estimatedTimes}
          onEstimatedTimeChange={handleEstimatedTimeChange}
          onStatusChange={handleOrderStatus}
          cancellationReasons={cancellationReasons}
          onCancellationReasonChange={handleCancellationReasonChange}
          asapTimers={asapTimers}
          preparationTimers={preparationTimers}
          formatTimeLeft={formatTimeLeft}
        />
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
