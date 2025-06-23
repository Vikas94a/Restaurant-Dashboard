"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { generateTimeSlots } from '@/utils/dateUtils';
import OrderStatus from '@/components/checkout/OrderStatus';

interface OperatingHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const getNextOpenDate = (operatingHours: Record<number, OperatingHours> | undefined) => {
  if (!operatingHours) return null;
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    if (isDateOpen(date, operatingHours)) {
      dates.push(date);
    }
  }
  return dates[0] || null;
};

const getTodayHours = (operatingHours: Record<number, OperatingHours> | undefined) => {
  if (!operatingHours) return null;
  const today = new Date();
  const dayOfWeek = today.getDay();
  return operatingHours[dayOfWeek];
};

const isDateOpen = (date: Date, operatingHours: Record<number, OperatingHours> | undefined) => {
  if (!operatingHours) return false;
  const dayOfWeek = date.getDay();
  return operatingHours[dayOfWeek]?.isOpen || false;
};

export default function CheckoutPage() {
  const cart = useSelector((state: RootState) => state.cart);
  const restaurantId = cart.restaurantId;

  const [isLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pickupDate: null as Date | null,
    pickupTime: '',
    specialInstructions: ''
  });

  const { showOrderStatus, setShowOrderStatus, placedOrder } = useOrderStatus({ orderId: restaurantId || '' });
  const { data: restaurantData } = useRestaurantData(restaurantId);

  const getPickupTimeSlots = useMemo(() => {
    return (date: Date) => {
      if (!restaurantData) return [];
      return generateTimeSlots(date, restaurantData.operatingHours);
    };
  }, [restaurantData]);

  useEffect(() => {
    if (!formData.pickupDate) {
      const nextOpenDate = getNextOpenDate(restaurantData?.operatingHours);
      if (nextOpenDate && isDateOpen(nextOpenDate, restaurantData?.operatingHours)) {
        setFormData(prev => ({ ...prev, pickupDate: nextOpenDate }));
      }
    }
  }, [formData.pickupDate, restaurantData?.operatingHours, setFormData]);

  useEffect(() => {
    const nextOpenDate = getNextOpenDate(restaurantData?.operatingHours);
    const todayHours = getTodayHours(restaurantData?.operatingHours);
    if (nextOpenDate && todayHours) {
      // This will be used later when we implement the date selection UI
      const dates = [nextOpenDate];
      // This will be used later when we implement the time selection UI
      const slots = getPickupTimeSlots(nextOpenDate);
      console.log('Available dates:', dates);
      console.log('Available slots:', slots);
    }
  }, [restaurantData?.operatingHours, getPickupTimeSlots]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      {/* Add your checkout form and order status components here */}
      {showOrderStatus && placedOrder && (
        <OrderStatus
          placedOrder={placedOrder}
          showOrderStatus={showOrderStatus}
          onReturnToMenu={() => setShowOrderStatus(false)}
        />
      )}
    </div>
  );
}