"use client";

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { clearCart } from '@/store/features/cartSlice';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Import types
import { CustomerFormData, RestaurantDetails, Order } from '@/types/checkout';
import { CartItem } from '@/types/cart';

// Import components
import CustomerForm from '@/components/checkout/CustomerForm';
import PickupTimeSelector from '@/components/checkout/PickupTimeSelector';
import OrderSummary from '@/components/checkout/OrderSummary';
import ConfirmDialog from '@/components/common/ConfirmDialog';
// import OrderStatus from '@/components/checkout/OrderStatus';

// Import utils and hooks
import { generateAvailablePickupTimes, isAsapPickupAvailable } from '@/utils/orderUtils';
import useOrderStatus from '@/hooks/useOrderStatus';

export default function CheckoutPage() {
  const { cart } = useCart();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Get restaurantId from cart
  const restaurantId = cart.items[0]?.restaurantId || null;

  // Use our orderStatus hook
  const { showOrderStatus, setShowOrderStatus, placedOrder, setPlacedOrder } = useOrderStatus(restaurantId);

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    pickupTime: '',
  });

  const [pickupOption, setPickupOption] = useState<'asap' | 'later'>('later');

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (!restaurantId) {
        setIsLoading(false);
        return;
      }

      try {
        const restaurantRef = doc(db, "restaurants", restaurantId);
        const restaurantDoc = await getDoc(restaurantRef);
        
        if (restaurantDoc.exists()) {
          const data = restaurantDoc.data();
          setRestaurantDetails({
            restaurantId: restaurantId,
            openingHours: data.openingHours || [],
            name: data.name || data.restaurantType || "Restaurant"
          });
        }
      } catch (error) {
        console.error("Error fetching restaurant details:", error);
        toast.error("Failed to load restaurant details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [restaurantId]);

  // Get current day and time (Memoize this if it doesn't need to update per second)
  const now = useMemo(() => new Date(), []); 
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Find today's hours
  const todayHours = useMemo(() => {
    if (!restaurantDetails?.openingHours) return undefined;
    const hours = restaurantDetails.openingHours.find(hour => 
      hour.day.toLowerCase() === currentDay
    );
    
    // If no hours for today, return undefined
    if (!hours) return undefined;
    
    // Ensure times are in 24-hour format with leading zeros
    const formatTime = (timeStr: string) => {
      if (!timeStr) return '00:00';
      const [hours, minutes] = timeStr.split(':');
      return `${hours.padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
    };
    
    return {
      ...hours,
      open: formatTime(hours.open),
      close: formatTime(hours.close)
    };
  }, [restaurantDetails?.openingHours, currentDay]);

  // Calculate available pickup times
  const { availableLaterTimes, openingTime, nowWithBuffer } = useMemo(() => {
    if (!todayHours) return { availableLaterTimes: [], openingTime: null, nowWithBuffer: null };
    return generateAvailablePickupTimes(todayHours, now);
  }, [todayHours, now]);

  // Check if ASAP pickup is available
  const isAsapAvailable = useMemo(() => {
    if (!todayHours) return false;
    return isAsapPickupAvailable(todayHours, now);
  }, [todayHours, now]);

  // Handle pickup option change
  const handleOptionChange = (option: 'asap' | 'later') => {
    setPickupOption(option);
    if (option === 'asap') {
      setFormData(prev => ({ ...prev, pickupTime: 'asap' }));
    } else {
      setFormData(prev => ({ ...prev, pickupTime: '' }));
    }
  };

  // Handle time selection
  const handleTimeChange = (time: string) => {
    setFormData(prev => ({ ...prev, pickupTime: time }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantId) {
      toast.error("No restaurant selected");
      return;
    }

    // Show confirmation dialog instead of submitting directly
    setShowConfirmDialog(true);
  };

  // Handle actual order submission
  const handleOrderSubmission = async () => {
    if (!restaurantId) {
      toast.error("No restaurant selected");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const order: Order = {
        id: `order_${Date.now()}`,
        restaurantId,
        customerDetails: formData,
        items: cart.items,
        total: cart.total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        pickupTime: formData.pickupTime,
        pickupOption
      };

      // Create order in restaurant's orders subcollection
      const orderRef = doc(db, "restaurants", restaurantId, "orders", order.id);
      await setDoc(orderRef, order);

      // Clear cart and show success
      dispatch(clearCart());
      setPlacedOrder(order);
      setShowOrderStatus(true);
      
      // Redirect to order status page
      router.push(`/order-status/${order.id}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        toast.error("Unable to place order. Please try again later.");
      } else if (error.code === 'unavailable') {
        toast.error("Service temporarily unavailable. Please try again in a few moments.");
      } else {
        toast.error("Failed to place order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no restaurant details are available and no order has been placed
  if (!restaurantDetails?.openingHours) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Restaurant hours not available. Cannot place order.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Checkout</h1>
      </header>
    
      {/* Main Content Container */}
      <div className="flex flex-col lg:flex-row justify-center items-start gap-8 max-w-6xl mx-auto w-full">
        {/* Customer Info and Pickup Time */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Your Details</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer Form Component */}
            <CustomerForm formData={formData} setFormData={setFormData} />
            
            {/* Pickup Time Selector Component */}
            <PickupTimeSelector
              formData={formData}
              pickupOption={pickupOption}
              handleOptionChange={handleOptionChange}
              handleTimeChange={handleTimeChange}
              isAsapAvailable={isAsapAvailable}
              availableLaterTimes={availableLaterTimes}
              todayHours={todayHours}
              now={now}
              openingTime={openingTime || new Date()}
              nowWithBuffer={nowWithBuffer || new Date()}
            />
          </form>
        </div>
    
        {/* Order Summary Component */}
        <OrderSummary
          cart={cart}
          handleSubmit={handleSubmit}
          pickupOption={pickupOption}
          formData={formData}
          isAsapAvailable={isAsapAvailable}
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleOrderSubmission}
        title="Confirm Order"
        message="Are you sure you want to place this order?"
        confirmText={isSubmitting ? "Placing Order..." : "Place Order"}
        cancelText="Cancel"
      />
    </div>
  );
} 