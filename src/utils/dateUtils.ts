interface OperatingHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export function generateTimeSlots(date: Date, operatingHours: Record<number, OperatingHours>): string[] {
  const dayOfWeek = date.getDay();
  const dayHours = operatingHours[dayOfWeek];

  if (!dayHours || !dayHours.isOpen) return [];

  const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = dayHours.closeTime.split(':').map(Number);

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
} 