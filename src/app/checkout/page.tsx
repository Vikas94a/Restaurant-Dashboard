"use client";

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import { createOrder } from '@/store/features/orderSlice';
import { clearCart } from '@/store/features/cartSlice';

// Import types
import { CustomerFormData, RestaurantDetails, CartItem, Order } from '@/types/checkout';

// Import components
import CustomerForm from '@/components/checkout/CustomerForm';
import PickupTimeSelector from '@/components/checkout/PickupTimeSelector';
import OrderSummary from '@/components/checkout/OrderSummary';
import OrderStatus from '@/components/checkout/OrderStatus';

// Import utils and hooks
import { generateAvailablePickupTimes, isAsapPickupAvailable } from '@/utils/orderUtils';
import useOrderStatus from '@/hooks/useOrderStatus';

// Types are now imported from @/types/checkout

export default function CheckoutPage() {
  const { cart } = useCart();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { restaurantDetails } = useAppSelector((state: RootState) => state.auth) as {
    restaurantDetails?: RestaurantDetails;
  };

  // Get restaurantId from Redux store, which is stable
  const restaurantId = restaurantDetails?.restaurantId || null;

  // Use our orderStatus hook
  const { showOrderStatus, setShowOrderStatus, placedOrder, setPlacedOrder } = useOrderStatus(restaurantId);

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    pickupTime: '',
  });

  const [pickupOption, setPickupOption] = useState<'asap' | 'later'>('later');

  // Get current day and time (Memoize this if it doesn't need to update per second)
  const now = useMemo(() => new Date(), []); 
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Find today's hours using Redux store data
  const todayHours = useMemo(() => 
    restaurantDetails?.openingHours?.find(hour => hour.day.toLowerCase() === currentDay), 
    [restaurantDetails?.openingHours, currentDay]
  );
  
  const [openHour, openMinute] = todayHours?.open?.split(':').map(Number) || [0, 0];
  const [closeHour, closeMinute] = todayHours?.close?.split(':').map(Number) || [0, 0];

  const openingTime = useMemo(() => {
    const time = new Date();
    time.setHours(openHour, openMinute, 0, 0);
    return time;
  }, [openHour, openMinute]);

  const closingTime = useMemo(() => {
    const time = new Date();
    time.setHours(closeHour, closeMinute, 0, 0);
    return time;
  }, [closeHour, closeMinute]);

  // Check if ASAP is a valid option
  const nowWithBuffer = useMemo(() => new Date(now.getTime() + 30 * 60000), [now]);
  const isAsapAvailable = useMemo(() => 
    isAsapPickupAvailable(todayHours, nowWithBuffer, openingTime, closingTime),
    [todayHours, nowWithBuffer, openingTime, closingTime]
  );

  // Generate available pickup times using our utility function
  const availableLaterTimes = useMemo(() => 
    generateAvailablePickupTimes(todayHours, openingTime, closingTime, nowWithBuffer),
    [todayHours, openingTime, closingTime, nowWithBuffer]
  );

  // Effect to set initial pickup option and time when restaurantDetails or availableLaterTimes become available
  useEffect(() => {
    // Only set initial pickup time if it hasn't been set yet
    if (!formData.pickupTime && restaurantDetails?.openingHours && restaurantDetails.openingHours.length > 0) {
      const initialPickupTime = availableLaterTimes.length > 0 ? availableLaterTimes[0] : '';
      setFormData(prev => ({ ...prev, pickupTime: initialPickupTime }));
    }
  }, [restaurantDetails?.openingHours, availableLaterTimes]);

  // Effect to handle pickup option changes
  useEffect(() => {
    // Only switch to 'later' if 'asap' is not available
    if (pickupOption === 'asap' && !isAsapAvailable) {
      setPickupOption('later');
    }
  }, [isAsapAvailable]);

  // If cart is empty, redirect to home or menu page

  useEffect(() => {
    if (cart.items.length === 0 && typeof window !== 'undefined' && placedOrder === null) {
      toast.info('Your cart is empty. Redirecting to menu.');
      router.replace('/');
    }
  }, [cart.items.length, router, placedOrder]);

  const handleOptionChange = (option: 'asap' | 'later') => {
    setPickupOption(option);
    if (option === 'asap') {
      setFormData(prev => ({ ...prev, pickupTime: 'As Soon As Possible' }));
    } else {
      // Set the pickup time to the first available later time or empty string
      setFormData(prev => ({ ...prev, pickupTime: availableLaterTimes.length > 0 ? availableLaterTimes[0] : '' }));
    }
  };

  const handleTimeChange = (time: string) => {
    setFormData(prev => ({ ...prev, pickupTime: time }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Please fill in all contact details');
      return;
    }

    if (pickupOption === 'later' && !formData.pickupTime) {
      toast.error('Please select a pickup time');
      return;
    }

    if (pickupOption === 'asap' && !isAsapAvailable) {
      toast.error('As Soon As Possible is not available at this time');
      return;
    }

    // Use the stable restaurantId from Redux state
    if (!restaurantDetails?.restaurantId) {
        toast.error('Restaurant details not available. Cannot place order.');
        return;
    }

    try {
      // Create order data
      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        items: cart.items.map((item: CartItem) => ({
          itemId: item.id,
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.itemPrice
        })),
        total: cart.total,
        pickupTime: formData.pickupTime,
        restaurantId: restaurantDetails.restaurantId,
      };

      // Dispatch create order action
      console.log('Attempting to create order...');
      const result = await dispatch(createOrder(orderData)).unwrap();
      console.log('Order created successfully with ID:', result.id);
      
      // Set the placedOrder state with the newly created order data
      setPlacedOrder(result);
      setShowOrderStatus(true);
      
      // Clear the cart
      dispatch(clearCart());

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  // If an order has been placed, show the order status view
  if (placedOrder !== null) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 p-6">
        <OrderStatus 
          placedOrder={placedOrder}
          showOrderStatus={showOrderStatus}
          setShowOrderStatus={setShowOrderStatus}
          onReturnToMenu={() => {
            setShowOrderStatus(false);
            if (restaurantDetails?.restaurantId) {
              router.push(`/restaurant/${restaurantDetails.restaurantId}/menu`);
            } else {
              router.push('/');
            }
          }}
        />
      </div>
    );
  }

  // If no order has been placed and cart is empty, show redirecting message.
  // The useEffect above will handle the actual redirect after a short delay.
  if (cart.items.length === 0) {
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  // If no restaurant details are available and no order has been placed.
  if (!restaurantDetails?.openingHours) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Restaurant hours not available. Cannot place order.</div>;
  }

  // Default render for when cart has items and no order has been placed yet (show the checkout form)
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
              openingTime={openingTime}
              nowWithBuffer={nowWithBuffer}
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
    </div>
  );
}