import { RestaurantHours } from '@/types/checkout';

interface PickupTimeResult {
  availableLaterTimes: string[];
  openingTime: Date | null;
  nowWithBuffer: Date | null;
}

export function generateAvailablePickupTimes(
  todayHours: RestaurantHours,
  now: Date
): PickupTimeResult {
  if (todayHours.closed) {
    return { availableLaterTimes: [], openingTime: null, nowWithBuffer: null };
  }

  const [openHour, openMinute] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);

  const openingTime = new Date(now);
  openingTime.setHours(openHour, openMinute, 0, 0);

  const closingTime = new Date(now);
  closingTime.setHours(closeHour, closeMinute, 0, 0);

  // Add 15 minutes buffer to current time
  const nowWithBuffer = new Date(now);
  nowWithBuffer.setMinutes(nowWithBuffer.getMinutes() + 15);

  // If we're before opening time, use opening time as start
  const startTime = nowWithBuffer < openingTime ? openingTime : nowWithBuffer;

  // Generate 30-minute intervals until closing time
  const availableLaterTimes: string[] = [];
  const currentTime = new Date(startTime);

  while (currentTime < closingTime) {
    // Add 30 minutes to current time
    currentTime.setMinutes(currentTime.getMinutes() + 30);

    // If we haven't passed closing time, add this time slot
    if (currentTime <= closingTime) {
      availableLaterTimes.push(
        currentTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
    }
  }

  return {
    availableLaterTimes,
    openingTime,
    nowWithBuffer
  };
}

export function isAsapPickupAvailable(
  todayHours: RestaurantHours,
  now: Date
): boolean {
  if (todayHours.closed) return false;

  const [openHour, openMinute] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);

  const openingTime = new Date(now);
  openingTime.setHours(openHour, openMinute, 0, 0);

  const closingTime = new Date(now);
  closingTime.setHours(closeHour, closeMinute, 0, 0);

  // Add 15 minutes buffer to current time
  const nowWithBuffer = new Date(now);
  nowWithBuffer.setMinutes(nowWithBuffer.getMinutes() + 15);

  // ASAP is available if:
  // 1. We're after opening time
  // 2. We're before closing time (with buffer)
  // 3. Restaurant is not closed
  return nowWithBuffer >= openingTime && nowWithBuffer < closingTime;
} 