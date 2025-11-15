"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateOrderStatus } from "@/store/features/orderSlice";
import { Order } from '@/types/checkout';
import { LoadingSpinner } from "@/components/dashboardcomponent/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReceipt, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { useSoundNotification } from "@/providers/SoundNotificationProvider";
import OrderNavBar from '@/components/Orders/OrderNavBar';
import { OrderList, OrderStats } from '@/features/orders/components';
import { useOrderTimers } from '@/features/orders/hooks/useOrderTimers';
import { BackendOrderStatus, OrderTab, OrderStats as OrderStatsType } from '@/features/orders/types';

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, restaurantDetails } = useAppSelector(
    (state: RootState) => state.auth
  );
  const { orders, status } = useAppSelector((state: RootState) => state.orders);
  const [loading, setLoading] = useState(true);
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, string>>({});
  const [selectedTab, setSelectedTab] = useState<OrderTab>('active');
  const [cancellationReasons, setCancellationReasons] = useState<Record<string, string>>({});
  
  // Use global sound notification
  const { SoundControls, stopRepeatingSound, debugAudio } = useSoundNotification();

  // Use order timers hook
  const { asapTimers, preparationTimers, clearAsapTimer } = useOrderTimers({
    orders,
    restaurantId: restaurantDetails?.restaurantId,
  });

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

      // Format estimated time if provided
      let formattedEstimatedTime = estimatedPickupTime?.trim();
      if (formattedEstimatedTime && !isNaN(Number(formattedEstimatedTime))) {
        // If it's just a number, format it as "X minutter"
        formattedEstimatedTime = `${formattedEstimatedTime} minutter`;
      }

      await dispatch(
        updateOrderStatus({
          orderId,
          restaurantId: restaurantDetails.restaurantId,
          newStatus,
          estimatedPickupTime: formattedEstimatedTime,
          cancellationReason: cancellationReason?.trim(),
        })
      ).unwrap();

      // Clear timer for ASAP orders when processed
      if (isAsapOrder) {
        clearAsapTimer(orderId);
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

      // Clear estimated time after successful acceptance
      if (newStatus === 'accepted') {
        setEstimatedTimes(prev => {
          const newTimes = { ...prev };
          delete newTimes[orderId];
          return newTimes;
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

  // Calculate stats
  const stats: OrderStatsType = {
    active: activeOrders.length,
    completed: completedOrders.length,
    rejected: rejectedOrders.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3 md:mr-4">
                <FontAwesomeIcon icon={faReceipt} className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Bestillingshåndtering
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  Administrer og spore alle bestillinger
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Global Sound Controls */}
              <SoundControls />

              {/* Debug Button */}
              <button
                onClick={debugAudio}
                className="p-2 md:p-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all duration-200"
                title="Debug Audio"
              >
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {status === 'loading' && orders.length > 0 && (
                <div className="flex items-center bg-orange-100 text-orange-800 px-3 md:px-4 py-2 rounded-lg">
                  <LoadingSpinner />
                  <span className="ml-2 text-xs md:text-sm font-medium">Oppdaterer bestillinger...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Stats Cards */}
        <OrderStats stats={stats} />

        {/* Navigation Tabs */}
        <OrderNavBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

        {/* Order List */}
        <OrderList
          orders={displayedOrders}
          estimatedTimes={estimatedTimes}
          onEstimatedTimeChange={handleEstimatedTimeChange}
          onStatusChange={handleOrderStatus}
          cancellationReasons={cancellationReasons}
          onCancellationReasonChange={handleCancellationReasonChange}
          asapTimers={asapTimers}
          preparationTimers={preparationTimers}
        />
      </main>
    </div>
  );
}
