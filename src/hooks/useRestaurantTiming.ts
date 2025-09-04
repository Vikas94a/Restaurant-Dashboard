import { useState, useEffect, useMemo } from 'react';
import { RestaurantDetails } from '@/types/checkout';

interface UseRestaurantTimingProps {
  restaurantDetails: RestaurantDetails | null;
}

export function useRestaurantTiming({ restaurantDetails }: UseRestaurantTimingProps) {
  const [pickupOption, setPickupOption] = useState<'asap' | 'later'>('asap');
  
  // Initialize pickup date with proper format
  const getTodayString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
  };
  
  const [pickupDate, setPickupDate] = useState(getTodayString());
  const [pickupTime, setPickupTime] = useState('');

  // Helper function to normalize day names for matching
  const normalizeDayName = (dayName: string): string => {
    const normalized = dayName.toLowerCase().trim();
    // Handle common variations and Norwegian day names
    const dayMappings: { [key: string]: string } = {
      // English variations
      'monday': 'monday',
      'mon': 'monday',
      'm': 'monday',
      'tuesday': 'tuesday',
      'tue': 'tuesday',
      'tues': 'tuesday',
      't': 'tuesday',
      'wednesday': 'wednesday',
      'wed': 'wednesday',
      'w': 'wednesday',
      'thursday': 'thursday',
      'thu': 'thursday',
      'thurs': 'thursday',
      'th': 'thursday',
      'friday': 'friday',
      'fri': 'friday',
      'f': 'friday',
      'saturday': 'saturday',
      'sat': 'saturday',
      's': 'saturday',
      'sunday': 'sunday',
      'sun': 'sunday',
      'su': 'sunday',
      // Norwegian variations
      'mandag': 'monday',
      'tirsdag': 'tuesday',
      'onsdag': 'wednesday',
      'torsdag': 'thursday',
      'fredag': 'friday',
      'lørdag': 'saturday',
      'søndag': 'sunday'
    };
    return dayMappings[normalized] || normalized;
  };

  // Helper function to get current day name in multiple formats
  const getCurrentDayNames = (): string[] => {
    const now = new Date();
    const longName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const shortName = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    return [longName, shortName];
  };

  const getTodayHours = () => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      return null;
    }
    
    const currentDayNames = getCurrentDayNames();
    
    // Try to find matching day in opening hours
    for (const dayName of currentDayNames) {
      const found = restaurantDetails.openingHours.find(hour => 
        normalizeDayName(hour.day) === normalizeDayName(dayName)
      );
      if (found) {
        return found;
      }
    }
    
    // If no exact match, try partial matching
    const currentDay = currentDayNames[0]; // Use long name as primary
    const partialMatch = restaurantDetails.openingHours.find(hour => 
      normalizeDayName(hour.day).includes(normalizeDayName(currentDay)) ||
      normalizeDayName(currentDay).includes(normalizeDayName(hour.day))
    );
    
    if (partialMatch) {
      return partialMatch;
    }
    
    return null;
  };

  const isAsapAvailable = useMemo(() => {
    const todayHours = getTodayHours();
    if (!todayHours || todayHours.closed) {
      return false;
    }
    
    const now = new Date();
    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
    
    const openingTime = new Date(now);
    openingTime.setHours(openHour, openMinute, 0, 0);
    const closingTime = new Date(now);
    closingTime.setHours(closeHour, closeMinute, 0, 0);
    
    // ASAP requires at least 30 minutes before closing
    const minimumTimeForAsap = new Date(now);
    minimumTimeForAsap.setMinutes(minimumTimeForAsap.getMinutes() + 30);
    
    // Check if we're within opening hours and have enough time before closing
    const isWithinHours = now >= openingTime && now < closingTime;
    const hasEnoughTime = minimumTimeForAsap < closingTime;
    
    const isAvailable = isWithinHours && hasEnoughTime;
    
    return isAvailable;
  }, [restaurantDetails?.openingHours]);

  const getNextOpenDate = () => {
    if (!restaurantDetails?.openingHours) return getTodayString();
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const check = new Date(today);
      check.setDate(today.getDate() + i);
      const dayOfWeek = check.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = restaurantDetails.openingHours.find(hour => 
        normalizeDayName(hour.day) === normalizeDayName(dayOfWeek)
      );
      if (dayHours && !dayHours.closed) {
        return check.getFullYear() + '-' + 
          String(check.getMonth() + 1).padStart(2, '0') + '-' + 
          String(check.getDate()).padStart(2, '0');
      }
    }
    return getTodayString();
  };

  const isDateOpen = (dateStr: string) => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      return false;
    }
    
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = restaurantDetails.openingHours.find(hour => 
      normalizeDayName(hour.day) === normalizeDayName(dayOfWeek)
    );
    
    const isOpen = !!dayHours && !dayHours.closed;
    
    return isOpen;
  };

  const getPickupTimeSlots = (selectedDate: string) => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      return [];
    }
    
    // Create date objects for comparison
    const now = new Date();
    const selectedDateObj = new Date(selectedDate + 'T00:00:00'); // Ensure we're working with the correct date
    
    // Compare dates properly by normalizing to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);
    const isToday = selectedDateObj.getTime() === today.getTime();
    
    // Get day's hours using robust matching
    const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = restaurantDetails.openingHours.find(hour => 
      normalizeDayName(hour.day) === normalizeDayName(dayOfWeek)
    );
    
    if (!dayHours || dayHours.closed) {
      return [];
    }
    
    // Parse opening hours
    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
    
    // Set up start and end times for the selected date
    const startTime = new Date(selectedDateObj);
    startTime.setHours(openHour, openMinute, 0, 0);
    
    const endTime = new Date(selectedDateObj);
    endTime.setHours(closeHour, closeMinute, 0, 0);
    
    // If it's today, we need to ensure we don't show past times
    if (isToday) {
      const currentTime = new Date(now);
      const minimumPickupTime = new Date(currentTime);
      minimumPickupTime.setMinutes(minimumPickupTime.getMinutes() + 30); // 30 minutes buffer
      
      // If minimum pickup time is after opening time, use it as start time
      if (minimumPickupTime > startTime) {
        startTime.setTime(minimumPickupTime.getTime());
      }
      
      // If start time is now past closing time, no slots available
      if (startTime >= endTime) {
        return [];
      }
    }
    
    // Round up to nearest 30 minutes
    startTime.setMinutes(Math.ceil(startTime.getMinutes() / 30) * 30);
    
    const slots: string[] = [];
    const currentSlotTime = new Date(startTime);
    
    // Generate time slots with 30-minute intervals
    while (currentSlotTime < endTime) {
      // Double check this slot is not in the past (for today)
      if (isToday) {
        const now = new Date();
        if (currentSlotTime <= now) {
          currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 30);
          continue;
        }
      }
      
      const timeString = currentSlotTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace(/\s/g, ''); // Remove spaces for consistent formatting
      
      slots.push(timeString);
      currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 30);
    }
    
    return slots;
  };

  const getAvailableDates = () => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      return [];
    }
    
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    for (let i = 0; i < 7; i++) {
      const check = new Date(today);
      check.setDate(today.getDate() + i);
      const dayOfWeek = check.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = restaurantDetails.openingHours.find(hour => 
        normalizeDayName(hour.day) === normalizeDayName(dayOfWeek)
      );
      
      if (dayHours && !dayHours.closed) {
        // Check if it's today and if we're past closing time
        if (i === 0) {
          const now = new Date();
          const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
          const closingTime = new Date(today);
          closingTime.setHours(closeHour, closeMinute, 0, 0);
          
          if (now >= closingTime) {
            continue; // Skip today if we're past closing time
          }
        }
        
        // Format date as YYYY-MM-DD
        const dateString = check.getFullYear() + '-' + 
          String(check.getMonth() + 1).padStart(2, '0') + '-' + 
          String(check.getDate()).padStart(2, '0');
        
        dates.push({
          date: dateString,
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

  // Function to validate if a selected time is valid
  const isTimeValid = (selectedDate: string, selectedTime: string) => {
    if (!selectedDate || !selectedTime) return false;
    
    const now = new Date();
    
    // Create date objects for comparison - use local timezone
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    const isToday = selectedDateObj.getTime() === today.getTime();
    
    
    if (isToday) {
      // Parse the selected time
      const [time, period] = selectedTime.replace(/\s/g, '').split(/(AM|PM)/i);
      const [hours, minutes] = time.split(':').map(Number);
      
      let selectedHour = hours;
      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        selectedHour += 12;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        selectedHour = 0;
      }
      
      const selectedDateTime = new Date(now);
      selectedDateTime.setHours(selectedHour, minutes, 0, 0);
      
      // Check if the selected time is in the past
      const minimumTime = new Date(now);
      minimumTime.setMinutes(minimumTime.getMinutes() + 30); // 30 minutes buffer
      
      const isValid = selectedDateTime >= minimumTime;
      
      
      return isValid;
    }
    
    return true; // For future dates, assume valid
  };

  // Auto-set pickup option based on availability
  useEffect(() => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      setPickupOption('later');
      return;
    }
    
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
    if (restaurantDetails?.openingHours && restaurantDetails.openingHours.length > 0 && !isDateOpen(pickupDate)) {
      setPickupDate(getNextOpenDate());
    }
  }, [restaurantDetails?.openingHours, pickupDate]);

  // Auto-set first available time when date changes
  useEffect(() => {
    if (!pickupDate || !restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      setPickupTime('');
      return;
    }
    
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
    getNextOpenDate,
    isTimeValid
  };
} 