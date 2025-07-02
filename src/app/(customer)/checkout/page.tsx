"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CustomerFormData, RestaurantDetails } from '@/types/checkout';
import CustomerForm from '@/components/checkout/CustomerForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import OrderStatus from '@/components/checkout/OrderStatus';
import PickupOptions from '@/components/checkout/PickupOptions';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { useRestaurantTiming } from '@/hooks/useRestaurantTiming';
import { useOrderSubmission } from '@/hooks/useOrderSubmission';

export default function CheckoutPage() {
  const { cart } = useCart();
  const router = useRouter();
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  
  const restaurantId = cart.items[0]?.restaurantId;
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    specialInstructions: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: ''
  });

  // Custom hooks
  const timing = useRestaurantTiming({ restaurantDetails });
  const { isSubmitting, orderId, localPlacedOrder, submitOrder, resetOrder } = useOrderSubmission({
    restaurantId: restaurantId || '',
    pickupOption: timing.pickupOption,
    pickupDate: timing.pickupDate,
    pickupTime: timing.pickupTime,
    isAsapAvailable: timing.isAsapAvailable,
    isDateOpen: timing.isDateOpen,
    getPickupTimeSlots: timing.getPickupTimeSlots
  });

  const { placedOrder } = useOrderStatus({ 
    orderId: orderId, 
    restaurantId: restaurantId,
    shouldListen: showOrderStatus
  });

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
        console.error('Error fetching restaurant details:', error);
        toast.error("Failed to load restaurant details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [restaurantId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await submitOrder(formData);
    if (result?.success) {
      setShowOrderStatus(true);
    }
  };

  // Handle return to menu
  const onReturnToMenu = () => {
    setShowOrderStatus(false);
    resetOrder();
    router.push(`/restaurant/${restaurantId || ''}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (!restaurantDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-600">Unable to load restaurant details. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Details</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <CustomerForm formData={formData} setFormData={setFormData} />
              
              <PickupOptions
                pickupOption={timing.pickupOption}
                setPickupOption={timing.setPickupOption}
                isAsapAvailable={timing.isAsapAvailable}
                pickupDate={timing.pickupDate}
                setPickupDate={timing.setPickupDate}
                pickupTime={timing.pickupTime}
                setPickupTime={timing.setPickupTime}
                availableDates={timing.getAvailableDates()}
                availablePickupTimes={timing.availablePickupTimes}
                isDateOpen={timing.isDateOpen}
                restaurantDetails={restaurantDetails}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-6 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                  isSubmitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark cursor-pointer'
                }`}
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
          
          <OrderSummary 
            cart={cart} 
            handleSubmit={handleSubmit} 
            pickupOption={timing.pickupOption} 
            formData={formData} 
            isAsapAvailable={timing.isAsapAvailable} 
          />
        </div>
        
        {localPlacedOrder && (
          <OrderStatus 
            placedOrder={localPlacedOrder} 
            showOrderStatus={showOrderStatus} 
            onReturnToMenu={onReturnToMenu} 
          />
        )}
      </div>
    </div>
  );
}