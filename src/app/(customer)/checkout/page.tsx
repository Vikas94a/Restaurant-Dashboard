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
import OrderStatus from '@/components/checkout/OrderStatus';
import useOrderStatus from '@/hooks/useOrderStatus';

export default function CheckoutPage() {
  const { cart } = useCart();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (!restaurantId) { setIsLoading(false); return; }
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
        toast.error("Failed to load restaurant details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurantDetails();
  }, [restaurantId]);

  const handleOptionChange = (option: 'asap' | 'later') => {
    setPickupOption(option);
    setFormData(prev => ({ ...prev, pickupTime: option === 'asap' ? 'asap' : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (pickupOption === 'asap') {
      const todayHours = getTodayHours();
      if (!todayHours) {
        toast.error('Restaurant hours not available');
        return;
      }

      if (todayHours.closed) {
        toast.error('Restaurant is closed today');
        return;
      }

      if (!isAsapAvailable) {
        toast.error('ASAP pickup is not available at this time');
        return;
      }
    } else {
      // For scheduled orders
      if (!formData.pickupDate || !formData.pickupTime) {
        toast.error('Please select a pickup date and time');
        return;
      }

      if (!isDateOpen(formData.pickupDate)) {
        toast.error('Restaurant is closed on selected date');
        return;
      }

      const availableTimes = getPickupTimeSlots(formData.pickupDate);
      if (!availableTimes.includes(formData.pickupTime)) {
        toast.error('Selected pickup time is not available');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const orderItems = cart.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        itemPrice: item.itemPrice,
        quantity: item.quantity,
        restaurantId: item.restaurantId,
        categoryName: item.categoryName,
        totalPrice: item.totalPrice,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || null
      }));
      const orderData: Order = {
        id: `order_${Date.now()}`,
        restaurantId,
        customerDetails: {
          name: formData.name?.trim() || '',
          email: formData.email?.trim() || '',
          phone: formData.phone?.trim() || '',
          pickupTime: pickupOption === 'asap' ? 'asap' : formData.pickupTime || '',
          pickupDate: pickupOption === 'asap' ? new Date().toISOString() : formData.pickupDate,
          specialInstructions: formData.specialInstructions?.trim() || ''
        },
        items: orderItems,
        total: cart.total || 0,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        pickupTime: pickupOption === 'asap' ? 'asap' : formData.pickupTime || '',
        pickupOption,
        estimatedPickupTime: null
      };
      const orderRef = doc(db, "restaurants", restaurantId, "orders", orderData.id);
      await setDoc(orderRef, orderData);
      dispatch(clearCart());
      setPlacedOrder(orderData);
      setShowOrderStatus(true);
    } catch (error: unknown) {
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

  const getTodayHours = () => {
    if (!restaurantDetails?.openingHours) return null;
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return restaurantDetails.openingHours.find(hour => hour.day.toLowerCase() === dayOfWeek) || null;
  };

  const isAsapAvailable = (() => {
    const todayHours = getTodayHours();
    if (!todayHours || todayHours.closed) return false;
    const now = new Date();
    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
    const openingTime = new Date(now);
    openingTime.setHours(openHour, openMinute, 0, 0);
    const closingTime = new Date(now);
    closingTime.setHours(closeHour, closeMinute, 0, 0);
    const nowWithBuffer = new Date(now);
    nowWithBuffer.setMinutes(nowWithBuffer.getMinutes() + 15);
    return nowWithBuffer >= openingTime && nowWithBuffer < closingTime;
  })();

  const getNextOpenDate = () => {
    if (!restaurantDetails?.openingHours) return new Date().toISOString().split('T')[0];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const check = new Date(today);
      check.setDate(today.getDate() + i);
      const dayOfWeek = check.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = restaurantDetails.openingHours.find(hour => hour.day.toLowerCase() === dayOfWeek);
      if (dayHours && !dayHours.closed) {
        return check.toISOString().split('T')[0];
      }
    }
    return today.toISOString().split('T')[0];
  };

  const isDateOpen = (dateStr: string) => {
    if (!restaurantDetails?.openingHours) return true;
    const date = new Date(dateStr);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = restaurantDetails.openingHours.find(hour => hour.day.toLowerCase() === dayOfWeek);
    return !!dayHours && !dayHours.closed;
  };

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

    if (date.toDateString() !== new Date().toDateString()) {
      startTime.setMinutes(Math.ceil(startTime.getMinutes() / 30) * 30);
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      if (now > startTime) {
        startTime.setTime(now.getTime());
      }
      startTime.setMinutes(Math.ceil(startTime.getMinutes() / 30) * 30);
    }

    const currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  };

  const availablePickupTimes = useMemo(() => getPickupTimeSlots(formData.pickupDate), [formData.pickupDate, restaurantDetails?.openingHours]);

  useEffect(() => {
    if (!isDateOpen(formData.pickupDate)) {
      setFormData(prev => ({ ...prev, pickupDate: getNextOpenDate() }));
    }
  }, [restaurantDetails?.openingHours]);

  useEffect(() => {
    const todayHours = getTodayHours();
    if (!todayHours || todayHours.closed) {
      setPickupOption('later');
      setFormData(prev => ({ ...prev, pickupDate: getNextOpenDate() }));
    } else if (isAsapAvailable) {
      setPickupOption('asap');
    } else {
      setPickupOption('later');
    }
  }, [isAsapAvailable]);

  useEffect(() => {
    if (!formData.pickupDate) return;
    const times = getPickupTimeSlots(formData.pickupDate);
    if (times.length > 0) {
      setFormData(prev => ({ ...prev, pickupTime: times[0] }));
    } else {
      setFormData(prev => ({ ...prev, pickupTime: '' }));
    }
  }, [formData.pickupDate, restaurantDetails?.openingHours]);

  const getAvailableDates = () => {
    if (!restaurantDetails?.openingHours) return [];
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const check = new Date(today);
      check.setDate(today.getDate() + i);
      const dayOfWeek = check.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = restaurantDetails.openingHours.find(hour => hour.day.toLowerCase() === dayOfWeek);
      
      if (dayHours && !dayHours.closed) {
        dates.push({
          date: check.toISOString().split('T')[0],
          display: `${check.getDate()} ${check.toLocaleDateString('en-US', { weekday: 'long' })}`
        });
      }
    }
    return dates;
  };

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
    <div className="bg-gray-50 py-12">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Details</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <CustomerForm formData={formData} setFormData={setFormData} />
              <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Pickup Options</h2>
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
                      disabled={!isAsapAvailable} 
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
                      <div className="grid grid-cols-2 gap-2">
                        {getAvailableDates().map(({ date, display }) => (
                          <button
                            key={date}
                            type="button"
                            onClick={() => setFormData({ ...formData, pickupDate: date })}
                            className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                              formData.pickupDate === date
                                ? 'bg-primary text-white border-primary'
                                : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            {display}
                          </button>
                        ))}
                      </div>
                      {getAvailableDates().length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          No available dates in the next 7 days
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Pickup Time
                      </label>
                      <select
                        value={formData.pickupTime}
                        onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        required
                      >
                        <option value="">Select a time</option>
                        {availablePickupTimes.map((time: string) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      {availablePickupTimes.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {!restaurantDetails?.openingHours ? "Restaurant hours not available" :
                            !isDateOpen(formData.pickupDate) ? "Restaurant is closed on selected date" :
                            "No available pickup times for selected date"}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

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
          <OrderSummary cart={cart} handleSubmit={handleSubmit} pickupOption={pickupOption} formData={formData} isAsapAvailable={true} />
        </div>
        {placedOrder && (<OrderStatus placedOrder={placedOrder} showOrderStatus={showOrderStatus} onReturnToMenu={onReturnToMenu} />)}
      </div>
    </div>
  );
}