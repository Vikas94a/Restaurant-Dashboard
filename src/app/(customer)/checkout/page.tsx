"use client";

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { clearCart } from '@/store/features/cartSlice';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CustomerFormData, RestaurantDetails, Order } from '@/types/checkout';
import CustomerForm from '@/components/checkout/CustomerForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import OrderStatus from '@/components/checkout/OrderStatus';
import useOrderStatus from '@/hooks/useOrderStatus';

export default function CheckoutPage() {
  const { cart } = useCart();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pickupOption, setPickupOption] = useState<'asap' | 'later'>('asap');
  const restaurantId = cart.items[0]?.restaurantId;

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    specialInstructions: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: ''
  });
  
  const { showOrderStatus, setShowOrderStatus, placedOrder, setPlacedOrder } = useOrderStatus(restaurantId);

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

  // Handle pickup option change
  const handleOptionChange = (option: 'asap' | 'later') => {
    setPickupOption(option);
    if (option === 'asap') {
      setFormData(prev => ({ ...prev, pickupTime: 'asap' }));
    } else {
      setFormData(prev => ({ ...prev, pickupTime: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!formData.email?.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (pickupOption === 'later' && !formData.pickupTime) {
      toast.error("Please select a pickup time");
      return;
    }

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
      const orderItems = cart.items.map(item => ({
        itemName: item.itemName,
        itemPrice: item.itemPrice,
        quantity: item.quantity,
        restaurantId: item.restaurantId,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions ? {
          text: item.specialInstructions.text,
          timestamp: item.specialInstructions.timestamp
        } : null
      }));

      const orderData: Order = {
        id: `order_${Date.now()}`,
        restaurantId,
        customerDetails: {
          name: formData.name || '',
          email: formData.email || '',
          phone: formData.phone || '',
          pickupTime: pickupOption === 'asap' ? 'asap' : formData.pickupTime || '',
          pickupDate: pickupOption === 'asap' ? new Date().toISOString() : formData.pickupDate || null,
          specialInstructions: formData.specialInstructions || ''
        },
        items: orderItems,
        total: cart.total || 0,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        pickupOption,
        estimatedPickupTime: null
      };

      const orderRef = doc(db, "restaurants", restaurantId, "orders", orderData.id);
      await setDoc(orderRef, orderData);

      dispatch(clearCart());
      setPlacedOrder(orderData);
      setShowOrderStatus(true);
      
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onReturnToMenu = () => {
    setShowOrderStatus(false);
    setPlacedOrder(null);
    router.push(`/restaurant/${restaurantId || ''}`);
  };

  // Generate pickup time slots based on restaurant hours
  const getPickupTimeSlots = (selectedDate: string) => {
    if (!restaurantDetails?.openingHours) return [];

    const date = new Date(selectedDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = restaurantDetails.openingHours.find(hour => hour.day.toLowerCase() === dayOfWeek);

    if (!dayHours || dayHours.closed) return [];

    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);

    const slots = [];
    const startTime = new Date(date);
    startTime.setHours(openHour, openMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(closeHour, closeMinute, 0, 0);

    // If it's today, start from current time + 30 minutes
    if (date.toDateString() === new Date().toDateString()) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      if (now > startTime) {
        startTime.setTime(now.getTime());
      }
    }

    // Round up to next 30-minute interval
    startTime.setMinutes(Math.ceil(startTime.getMinutes() / 30) * 30);

    // Generate 30-minute intervals until closing time
    while (startTime < endTime) {
      slots.push(
        startTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
      startTime.setMinutes(startTime.getMinutes() + 30);
    }

    return slots;
  };

  // Get available pickup times for the selected date
  const availablePickupTimes = useMemo(() => {
    return getPickupTimeSlots(formData.pickupDate);
  }, [formData.pickupDate, restaurantDetails?.openingHours]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
    <div className="flex flex-col min-h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Checkout</h1>
        <p className="text-gray-600 text-center mt-2">{restaurantDetails.name}</p>
      </header>
    
      <div className="flex flex-col lg:flex-row justify-center items-start gap-8 max-w-6xl mx-auto w-full">
        <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Your Details</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <CustomerForm formData={formData} setFormData={setFormData} />
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pickupOption"
                    value="asap"
                    checked={pickupOption === 'asap'}
                    onChange={(e) => handleOptionChange(e.target.value as 'asap' | 'later')}
                    className="mr-2"
                  />
                  As Soon as Possible
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pickupOption"
                    value="later"
                    checked={pickupOption === 'later'}
                    onChange={(e) => handleOptionChange(e.target.value as 'asap' | 'later')}
                    className="mr-2"
                  />
                  Schedule for Later
                </label>
              </div>

              {pickupOption === 'later' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={formData.pickupDate}
                      onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pickup Time
                    </label>
                    <select
                      value={formData.pickupTime}
                      onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    >
                      <option value="">Select a time</option>
                      {availablePickupTimes.map((time: string) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
              }`}
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>

        <div className="w-full lg:w-96 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <OrderSummary cart={cart} />
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleOrderSubmission}
        title="Confirm Order"
        message="Are you sure you want to place this order?"
        confirmText="Place Order"
        cancelText="Cancel"
      />

      {placedOrder && (
        <OrderStatus
          placedOrder={placedOrder}
          showOrderStatus={showOrderStatus}
          onReturnToMenu={onReturnToMenu}
        />
      )}
    </div>
  );
} 