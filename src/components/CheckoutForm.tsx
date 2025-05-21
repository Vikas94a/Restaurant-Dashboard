"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { clearCart } from '@/store/features/cartSlice';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantHours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
}

export default function CheckoutForm({ isOpen, onClose, restaurantHours }: CheckoutFormProps) {
  const { cart } = useCart();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pickupTime: '',
  });

  const [pickupOption, setPickupOption] = useState<'asap' | 'later'>('later'); // State for pickup option

  // Get current day and time
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Find today's hours
  const todayHours = restaurantHours.find(hour => hour.day.toLowerCase() === currentDay);
  const [openHour, openMinute] = todayHours?.open?.split(':').map(Number) || [0, 0];
  const [closeHour, closeMinute] = todayHours?.close?.split(':').map(Number) || [0, 0];

  const openingTime = new Date();
  openingTime.setHours(openHour, openMinute, 0, 0);

  const closingTime = new Date();
  closingTime.setHours(closeHour, closeMinute, 0, 0);

  // Check if ASAP is a valid option
  const isAsapAvailable = todayHours && !todayHours.closed && now >= openingTime && now < closingTime;

  // Generate available pickup times (30-minute intervals)
  const generatePickupTimes = () => {
    if (!todayHours || todayHours.closed) {
      return [];
    }
    
    const times = [];
    
    let startTime = new Date();
    // If restaurant hasn't opened yet today, start from opening time
    if (now < openingTime) {
      startTime = new Date(openingTime);
    } else {
      // If restaurant is already open, start from current time
      // Round up to next 30-minute interval
      const minutes = startTime.getMinutes();
      startTime.setMinutes(minutes + (30 - (minutes % 30)));
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    // Generate time slots until closing time
    while (startTime < closingTime) {
      // Only add times that are at least 30 minutes in the future
      if (startTime > now) {
        times.push(startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }));
      }
      startTime.setMinutes(startTime.getMinutes() + 30);
    }

    return times;
  };

  const availableLaterTimes = generatePickupTimes();

  // Set initial pickup option and time
  useEffect(() => {
    if (isAsapAvailable) {
      setPickupOption('asap');
      setFormData(prev => ({ ...prev, pickupTime: 'As Soon As Possible' }));
    } else {
      setPickupOption('later');
      // Optionally pre-select the first available later time if any exist
      if (availableLaterTimes.length > 0) {
         setFormData(prev => ({ ...prev, pickupTime: availableLaterTimes[0] }));
      } else {
         setFormData(prev => ({ ...prev, pickupTime: '' })); // No times available
      }
    }
  }, [isAsapAvailable, availableLaterTimes.length]); // Depend on availability and times list change

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
    // If ASAP is chosen and not available, show error (shouldn't happen if UI is correct, but for safety)
     if (pickupOption === 'asap' && !isAsapAvailable) {
        toast.error('As Soon As Possible is not available at this time');
        return;
    }

    // Construct order data (add pickupOption and pickupTime)
    const orderData = {
        ...formData,
        pickupOption: pickupOption === 'asap' ? 'ASAP' : 'Scheduled',
        cartItems: cart.items,
        cartTotal: cart.total,
        // You might want to add restaurant ID here
    };

    console.log('Submitting order:', orderData);

    try {
      // Here you would typically send the order to your backend
      // For now, we'll just show a success message
      toast.success('Order placed successfully!');
      
      // Clear the cart
      dispatch(clearCart());
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 backdrop-blur-sm bg-white/30"
        onClick={onClose}
      />

      {/* Form Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Checkout</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Contact Details */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Pickup Time Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
                <div className="space-y-2">
                  {isAsapAvailable && (
                    <div 
                      className={`flex items-center px-3 py-2 border rounded-md cursor-pointer ${pickupOption === 'asap' ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
                      onClick={() => handleOptionChange('asap')}
                    >
                      <input
                        type="radio"
                        id="pickup-asap"
                        name="pickupOption"
                        value="asap"
                        checked={pickupOption === 'asap'}
                        onChange={() => handleOptionChange('asap')}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <label htmlFor="pickup-asap" className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
                        As soon as possible
                      </label>
                    </div>
                  )}

                  <div 
                     className={`flex items-center px-3 py-2 border rounded-md cursor-pointer ${pickupOption === 'later' ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
                     onClick={() => handleOptionChange('later')}
                   >
                    <input
                      type="radio"
                      id="pickup-later"
                      name="pickupOption"
                      value="later"
                      checked={pickupOption === 'later'}
                      onChange={() => handleOptionChange('later')}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor="pickup-later" className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
                      Later
                    </label>
                  </div>
                </div>

                {/* Later Time Selection (Conditional) */}
                {pickupOption === 'later' && (
                  availableLaterTimes.length > 0 ? (
                    <div className="mt-3">
                       <select
                          value={formData.pickupTime}
                          onChange={(e) => handleTimeChange(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          required={pickupOption === 'later'} // Make required only if later is selected
                        >
                          {/* Only show the default option if no time is pre-selected */}
                           {formData.pickupTime === '' && <option value="">Select a time</option>}
                          {availableLaterTimes.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                    </div>
                  ) : (
                     <p className="mt-3 text-sm text-gray-500">
                       {!todayHours 
                         ? "Restaurant hours not available" 
                         : todayHours.closed 
                           ? "Restaurant is closed today" 
                         : now < openingTime
                             ? `Restaurant opens at ${todayHours.open}`
                             : "No available pickup times for later"}
                     </p>
                  )
                )}

                 {/* Message when only ASAP is available and selected, or if restaurant is closed/not open yet */}
                {!isAsapAvailable && pickupOption === 'later' && availableLaterTimes.length === 0 && (
                   <p className="mt-3 text-sm text-gray-500">
                       {!todayHours 
                         ? "Please try again later" 
                         : todayHours.closed 
                           ? "Please check back tomorrow" 
                         : now < openingTime
                             ? `Restaurant opens at ${todayHours.open}`
                             : "No available pickup times today"}
                   </p>
                )}

              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Order Summary</h3>
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.itemName} x {item.quantity}</span>
                    <span>${(item.itemPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 font-semibold flex justify-between">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Payment Method</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">Pay at counter</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
            >
              Place Order
            </button>
          </form>
        </div>
      </div>
    </>
  );
} 