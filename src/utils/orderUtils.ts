import { RestaurantHours } from '@/types/checkout';

/**
 * Calculate available pickup times based on restaurant hours and current time
 */
export const generateAvailablePickupTimes = (
  todayHours: RestaurantHours | undefined,
  openingTime: Date,
  closingTime: Date,
  nowWithBuffer: Date
): string[] => {
  if (!todayHours || todayHours.closed) {
    return [];
  }
  
  const times = [];
  
  let startTime = new Date();
  // If restaurant hasn't opened yet today, start from opening time plus buffer
  if (nowWithBuffer < openingTime) {
    startTime = new Date(openingTime);
  } else {
    // If restaurant is already open, start from current time plus buffer
    // Round up to next 30-minute interval from nowWithBuffer
    startTime = new Date(nowWithBuffer);
    const minutes = startTime.getMinutes();
    // Ensure we don't go past the closing time and round correctly
    let roundedMinutes = minutes + (30 - (minutes % 30));
    if (roundedMinutes >= 60) {
      startTime.setHours(startTime.getHours() + 1);
      roundedMinutes = roundedMinutes % 60; // Handle minute wrap-around
    }
    startTime.setMinutes(roundedMinutes);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);
  }

  // Generate time slots until closing time
  while (startTime < closingTime) {
    // Ensure the generated time is after nowWithBuffer, adding a small buffer to avoid exact match issues
    if (startTime.getTime() > nowWithBuffer.getTime() + 1000) { // Add a 1 second buffer
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

/**
 * Check if ASAP pickup is available
 */
export const isAsapPickupAvailable = (
  todayHours: RestaurantHours | undefined,
  nowWithBuffer: Date,
  openingTime: Date,
  closingTime: Date
): boolean => {
  return Boolean(todayHours && !todayHours.closed && nowWithBuffer >= openingTime && nowWithBuffer < closingTime);
};
