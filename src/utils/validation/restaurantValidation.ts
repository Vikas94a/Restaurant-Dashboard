import { RestaurantDetails, RestaurantHour } from '@/store/features/restaurantSlice';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRestaurantHours(hours: RestaurantHour[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const days = new Set<string>();

  hours.forEach((hour, index) => {
    // Check for duplicate days
    if (days.has(hour.day)) {
      errors.push({
        field: `hours[${index}].day`,
        message: `Duplicate day: ${hour.day}`
      });
    }
    days.add(hour.day);

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!hour.isClosed) {
      if (!timeRegex.test(hour.openTime)) {
        errors.push({
          field: `hours[${index}].openTime`,
          message: 'Invalid opening time format. Use HH:mm'
        });
      }
      if (!timeRegex.test(hour.closeTime)) {
        errors.push({
          field: `hours[${index}].closeTime`,
          message: 'Invalid closing time format. Use HH:mm'
        });
      }
    }
  });

  return errors;
}

export function validateRestaurantDetails(details: Partial<RestaurantDetails>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!details.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'Restaurant name is required'
    });
  }

  // Optional fields validation
  if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format'
    });
  }

  if (details.phone && !/^\+?[\d\s-]{10,}$/.test(details.phone)) {
    errors.push({
      field: 'phone',
      message: 'Invalid phone number format'
    });
  }

  if (details.website && !/^https?:\/\/.+/.test(details.website)) {
    errors.push({
      field: 'website',
      message: 'Invalid website URL'
    });
  }

  if (details.taxRate !== undefined && (details.taxRate < 0 || details.taxRate > 100)) {
    errors.push({
      field: 'taxRate',
      message: 'Tax rate must be between 0 and 100'
    });
  }

  if (details.deliveryFee !== undefined && details.deliveryFee < 0) {
    errors.push({
      field: 'deliveryFee',
      message: 'Delivery fee cannot be negative'
    });
  }

  if (details.minimumOrder !== undefined && details.minimumOrder < 0) {
    errors.push({
      field: 'minimumOrder',
      message: 'Minimum order amount cannot be negative'
    });
  }

  // Validate opening hours if provided
  if (details.openingHours) {
    errors.push(...validateRestaurantHours(details.openingHours));
  }

  return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field}: ${error.message}`).join('\n');
} 