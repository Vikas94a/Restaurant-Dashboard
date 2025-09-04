import { useState, useEffect, useMemo } from 'react';
import { RestaurantDetails } from '@/types/checkout';
import { ReservationSettings } from '@/types/reservation';

interface UseReservationTimingProps {
  restaurantDetails: RestaurantDetails | null;
  reservationSettings: ReservationSettings | null;
}

export function useReservationTiming({ restaurantDetails, reservationSettings }: UseReservationTimingProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Initialize selected date with today
  const getTodayString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
  };

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

  // Get restaurant hours for a specific date
  const getDateHours = (dateStr: string) => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      return null;
    }
    
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = restaurantDetails.openingHours.find(hour => 
      normalizeDayName(hour.day) === normalizeDayName(dayOfWeek)
    );
    
    return dayHours;
  };

  // Check if a date is open for reservations
  const isDateOpen = (dateStr: string) => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      return false;
    }
    
    const dayHours = getDateHours(dateStr);
    const isOpen = !!dayHours && !dayHours.closed;
    
    return isOpen;
  };

  // Generate available dates for the next 30 days
  const getAvailableDates = () => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      return [];
    }
    
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get advance booking limit from reservation settings
    const maxDays = reservationSettings?.advanceBookingDays || 30;
    
    for (let i = 0; i < maxDays; i++) {
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
          display: `${check.toLocaleDateString('en-US', { weekday: 'long' })} ${check.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          dayOfWeek: check.toLocaleDateString('en-US', { weekday: 'long' })
        });
      }
    }
    
    return dates;
  };

  // Generate time slots for a specific date
  const getTimeSlots = (dateStr: string) => {
    if (!restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      return [];
    }
    
    if (!reservationSettings) {
      return [];
    }
    
    const dayHours = getDateHours(dateStr);
    if (!dayHours || dayHours.closed) {
      return [];
    }
    
    // Create date objects for comparison
    const now = new Date();
    const selectedDateObj = new Date(dateStr + 'T00:00:00');
    const isToday = selectedDateObj.toDateString() === now.toDateString();
    
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
      const minimumReservationTime = new Date(currentTime);
      minimumReservationTime.setMinutes(minimumReservationTime.getMinutes() + 30); // 30 minutes buffer
      
      // If minimum reservation time is after opening time, use it as start time
      if (minimumReservationTime > startTime) {
        startTime.setTime(minimumReservationTime.getTime());
      }
      
      // If start time is now past closing time, no slots available
      if (startTime >= endTime) {
        return [];
      }
    }
    
    // Round up to nearest time slot interval
    const intervalMinutes = reservationSettings.timeSlotInterval || 30;
    startTime.setMinutes(Math.ceil(startTime.getMinutes() / intervalMinutes) * intervalMinutes);
    
    const slots: string[] = [];
    const currentSlotTime = new Date(startTime);
    
    // Generate time slots with specified interval
    while (currentSlotTime < endTime) {
      // Double check this slot is not in the past (for today)
      if (isToday) {
        const now = new Date();
        if (currentSlotTime <= now) {
          currentSlotTime.setMinutes(currentSlotTime.getMinutes() + intervalMinutes);
          continue;
        }
      }
      
      const timeString = currentSlotTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace(/\s/g, ''); // Remove spaces for consistent formatting
      
      slots.push(timeString);
      currentSlotTime.setMinutes(currentSlotTime.getMinutes() + intervalMinutes);
    }
    
    
    return slots;
  };

  // Function to validate if a selected time is valid
  const isTimeValid = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;
    
    const now = new Date();
    
    // Create date objects for comparison - use local timezone
    const selectedDateObj = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    const isToday = selectedDateObj.getTime() === today.getTime();
    
    
    if (isToday) {
      // Parse the selected time
      const [time, period] = timeStr.replace(/\s/g, '').split(/(AM|PM)/i);
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

  // Auto-set first available time when date changes
  useEffect(() => {
    if (!selectedDate || !restaurantDetails?.openingHours || restaurantDetails.openingHours.length === 0) {
      setSelectedTime('');
      return;
    }
    
    const times = getTimeSlots(selectedDate);
    if (times.length > 0) {
      setSelectedTime(times[0]);
    } else {
      setSelectedTime('');
    }
  }, [selectedDate, restaurantDetails?.openingHours, reservationSettings]);

  // Initialize selected date
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(getTodayString());
    }
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    isDateOpen,
    getAvailableDates,
    getTimeSlots,
    isTimeValid,
    getDateHours
  };
}
