import { useState, useEffect, useMemo } from 'react';
import { RestaurantDetails } from '@/types/checkout';

interface UseRestaurantTimingProps {
  restaurantDetails: RestaurantDetails | null;
}

export function useRestaurantTiming({ restaurantDetails }: UseRestaurantTimingProps) {
  const [pickupOption, setPickupOption] = useState<'asap' | 'later'>('asap');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('');

  const getTodayHours = () => {
    if (!restaurantDetails?.openingHours) return null;
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return restaurantDetails.openingHours.find(hour => hour.day.toLowerCase() === dayOfWeek) || null;
  };

  const isAsapAvailable = useMemo(() => {
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
  }, [restaurantDetails?.openingHours]);

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
    
    // Create date objects for comparison
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const isToday = selectedDateObj.toDateString() === now.toDateString();
    
    // Get day's hours
    const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = restaurantDetails.openingHours.find(hour => hour.day.toLowerCase() === dayOfWeek);
    
    if (!dayHours || dayHours.closed) return [];
    
    // Parse opening hours
    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
    
    // Set up start and end times for the selected date
    const startTime = new Date(selectedDateObj);
    startTime.setHours(openHour, openMinute, 0, 0);
    
    const endTime = new Date(selectedDateObj);
    endTime.setHours(closeHour, closeMinute, 0, 0);
    
    // If it's today, adjust start time to account for current time plus buffer
    if (isToday) {
      const nowPlusBuffer = new Date(now);
      nowPlusBuffer.setMinutes(nowPlusBuffer.getMinutes() + 30);
      if (nowPlusBuffer > startTime) {
        startTime.setTime(nowPlusBuffer.getTime());
      }
    }
    
    // Round up to nearest 30 minutes
    startTime.setMinutes(Math.ceil(startTime.getMinutes() / 30) * 30);
    
    const slots: string[] = [];
    const currentTime = new Date(startTime);
    
    // Generate time slots
    while (currentTime < endTime) {
      const timeString = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace(/\s/g, ''); // Remove spaces for consistent formatting
      
      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    return slots;
  };

  const getAvailableDates = () => {
    if (!restaurantDetails?.openingHours) return [];
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    for (let i = 0; i < 7; i++) {
      const check = new Date(today);
      check.setDate(today.getDate() + i);
      const dayOfWeek = check.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = restaurantDetails.openingHours.find(hour => hour.day.toLowerCase() === dayOfWeek);
      
      if (dayHours && !dayHours.closed) {
        // Check if it's today and if we're past closing time
        if (i === 0) {
          const now = new Date();
          const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
          const closingTime = new Date(today);
          closingTime.setHours(closeHour, closeMinute, 0, 0);
          
          if (now >= closingTime) continue; // Skip today if we're past closing time
        }
        
        dates.push({
          date: check.toISOString().split('T')[0],
          display: `${check.toLocaleDateString('en-US', { weekday: 'long' })} ${check.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        });
      }
    }
    return dates;
  };

  const availablePickupTimes = useMemo(() => 
    getPickupTimeSlots(pickupDate), 
    [pickupDate, restaurantDetails?.openingHours]
  );

  // Auto-set pickup option based on availability
  useEffect(() => {
    const todayHours = getTodayHours();
    if (!todayHours || todayHours.closed) {
      setPickupOption('later');
      setPickupDate(getNextOpenDate());
    } else if (isAsapAvailable) {
      setPickupOption('asap');
    } else {
      setPickupOption('later');
    }
  }, [isAsapAvailable, restaurantDetails?.openingHours]);

  // Auto-set pickup date if current date is closed
  useEffect(() => {
    if (!isDateOpen(pickupDate)) {
      setPickupDate(getNextOpenDate());
    }
  }, [restaurantDetails?.openingHours]);

  // Auto-set first available time when date changes
  useEffect(() => {
    if (!pickupDate) return;
    const times = getPickupTimeSlots(pickupDate);
    if (times.length > 0) {
      setPickupTime(times[0]);
    } else {
      setPickupTime('');
    }
  }, [pickupDate, restaurantDetails?.openingHours]);

  return {
    pickupOption,
    setPickupOption,
    pickupDate,
    setPickupDate,
    pickupTime,
    setPickupTime,
    isAsapAvailable,
    isDateOpen,
    getPickupTimeSlots,
    getAvailableDates,
    availablePickupTimes,
    getNextOpenDate
  };
} 