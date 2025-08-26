"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ReservationService } from '@/services/reservationService';
import { ReservationSettings, AvailabilityResponse, CreateReservationRequest } from '@/types/reservation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faUsers, 
  faUser, 
  faEnvelope, 
  faPhone, 
  faUtensils,
  faCheck,
  faTimes,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface RestaurantInfo {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export default function ReservationPage() {
  const params = useParams();
  const domain = params.domain as string;
  
  console.log('ReservationPage rendered with params:', params);
  console.log('Domain extracted:', domain);
  
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [reservationSettings, setReservationSettings] = useState<ReservationSettings | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    console.log('useEffect triggered with domain:', domain);
    if (domain && domain.trim() !== '') {
      console.log('Loading restaurant data for domain:', domain);
      loadRestaurantData();
    } else {
      console.log('Invalid domain, not loading restaurant data');
    }
  }, [domain]);



  const loadRestaurantData = async () => {
    try {
      console.log('Setting loading state to true');
      setIsLoading(true);
      console.log('Loading restaurant data for domain:', domain);
      
      if (!domain) {
        console.log('No domain provided');
        toast.error('Invalid restaurant URL');
        return;
      }
      
      // Get restaurant by domain
      const restaurantsRef = collection(db, 'restaurants');
      const q = query(restaurantsRef, where('domain', '==', domain));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No restaurant found for domain:', domain);
        toast.error('Restaurant not found');
        return;
      }

      const restaurantDoc = querySnapshot.docs[0];
      const restaurantData = restaurantDoc.data();
      console.log('Restaurant found:', { id: restaurantDoc.id, data: restaurantData });
      
      // Validate restaurant data
      if (!restaurantData.name) {
        console.log('Restaurant data missing name');
        toast.error('Restaurant information is incomplete');
        return;
      }
      
      // Set restaurant ID
      setRestaurantId(restaurantDoc.id);
      console.log('Restaurant ID set:', restaurantDoc.id);
      
      setRestaurantInfo({
        name: restaurantData.name || 'Restaurant',
        description: restaurantData.description,
        address: restaurantData.address,
        phone: restaurantData.phone,
        email: restaurantData.email,
        logo: restaurantData.logo
      });

      // Load reservation settings
      console.log('Loading reservation settings for restaurant:', restaurantDoc.id);
      const settings = await ReservationService.getReservationSettings(restaurantDoc.id);
      console.log('Reservation settings loaded:', settings);
      
      if (settings) {
        console.log('Settings structure:', {
          enabled: settings.enabled,
          hasRequiredFields: !!(settings.openingTime && settings.closingTime && settings.timeSlotInterval && settings.maxReservationsPerTimeSlot)
        });
      }
      
      setReservationSettings(settings);
      
      if (!settings?.enabled) {
        console.log('Reservations not enabled for restaurant');
        toast.error('Reservations are not currently available at this restaurant');
        return;
      }
      
      // Check if settings have all required fields
      if (!settings.openingTime || !settings.closingTime || !settings.timeSlotInterval || !settings.maxReservationsPerTimeSlot) {
        console.log('Reservation settings missing required fields:', {
          openingTime: settings.openingTime,
          closingTime: settings.closingTime,
          timeSlotInterval: settings.timeSlotInterval,
          maxReservationsPerTimeSlot: settings.maxReservationsPerTimeSlot
        });
        toast.error('Reservation settings are incomplete. Please contact the restaurant.');
        return;
      }
      
      console.log('Reservation settings validated successfully');
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      toast.error('Failed to load restaurant information');
    } finally {
      console.log('Setting loading state to false');
      setIsLoading(false);
    }
  };

  const checkAvailability = async () => {
    console.log('checkAvailability called with:', { selectedDate, reservationSettings: !!reservationSettings, restaurantId });
    
    if (!selectedDate || !reservationSettings || !restaurantId) {
      console.log('Missing required data:', { selectedDate, reservationSettings: !!reservationSettings, restaurantId });
      return;
    }
    
    console.log('All required data present, proceeding with availability check');

    try {
      console.log('Setting availability checking state to true');
      setIsCheckingAvailability(true);
      console.log('Calling ReservationService.checkAvailability with:', { restaurantId, selectedDate });
      
      const availabilityData = await ReservationService.checkAvailability(
        restaurantId,
        selectedDate
      );
      
      console.log('Availability data received:', availabilityData);
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Failed to check availability');
    } finally {
      console.log('Setting availability checking state to false');
      setIsCheckingAvailability(false);
    }
  };

  const handleDateChange = (date: string) => {
    console.log('Date changed to:', date);
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
    
    // Check availability after a short delay to ensure state is updated
    setTimeout(() => {
      console.log('Checking availability in timeout with:', { date, reservationSettings: !!reservationSettings, restaurantId });
      if (date && reservationSettings && restaurantId) {
        checkAvailability();
      } else {
        console.log('Cannot check availability - missing data:', { date, reservationSettings: !!reservationSettings, restaurantId });
      }
    }, 100);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission attempted with:', {
      restaurantId,
      reservationSettings: !!reservationSettings,
      selectedDate,
      selectedTime,
      customerName,
      customerEmail,
      customerPhone
    });
    
    if (!restaurantId || !reservationSettings || !selectedDate || !selectedTime) {
      console.log('Form validation failed - missing reservation data');
      toast.error('Please select a date and time');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      console.log('Form validation failed - missing customer data');
      toast.error('Please fill in all required fields');
      return;
    }
    
    console.log('Form validation passed, proceeding with reservation creation');

    try {
      console.log('Setting submission state to true');
      setIsSubmitting(true);
      
      const reservationRequest: CreateReservationRequest = {
        restaurantId: restaurantId,
        domain,
        customerDetails: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          specialRequests: specialRequests || undefined
        },
        reservationDetails: {
          date: selectedDate,
          time: selectedTime,
          partySize
        }
      };

      console.log('Creating reservation with request:', reservationRequest);
      const reservation = await ReservationService.createReservation(reservationRequest);
      console.log('Reservation created successfully:', reservation);
      
      toast.success('Reservation submitted successfully!');
      
      console.log('Resetting form after successful submission');
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSpecialRequests('');
      setPartySize(2);
      
      // Show confirmation
      // You could redirect to a confirmation page here
      
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || 'Failed to submit reservation');
    } finally {
      console.log('Setting submission state to false');
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    if (!reservationSettings?.advanceBookingDays) return '';
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + reservationSettings.advanceBookingDays);
    return maxDate.toISOString().split('T')[0];
  };

  if (!domain) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faTimes} className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid URL</h1>
          <p className="text-gray-600">Please check the restaurant URL and try again.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant information...</p>
        </div>
      </div>
    );
  }

  if (!reservationSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Reservation System</h1>
          <p className="text-gray-600">
            Please wait while we load the reservation settings...
          </p>
        </div>
      </div>
    );
  }

  if (!reservationSettings.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <FontAwesomeIcon icon={faTimes} className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reservations Unavailable</h1>
          <p className="text-gray-600">
            This restaurant is not currently accepting reservations. Please contact them directly for booking inquiries.
          </p>
        </div>
      </div>
    );
  }

  if (!restaurantInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Restaurant Information</h1>
          <p className="text-gray-600">
            Please wait while we load the restaurant details...
          </p>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Restaurant ID</h1>
          <p className="text-gray-600">
            Please wait while we load the restaurant identifier...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            {restaurantInfo?.logo && (
              <img 
                src={restaurantInfo.logo} 
                alt={restaurantInfo.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{restaurantInfo?.name}</h1>
              {restaurantInfo?.description && (
                <p className="text-gray-600 mt-1">{restaurantInfo.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reservation Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6 text-orange-500 mr-3" />
              Make a Reservation
            </h2>
            
            {/* Debug Info - Remove this in production */}
            {process.env.NODE_ENV === 'development' && restaurantId && reservationSettings && restaurantInfo && (
              <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
                <strong>Debug Info:</strong><br />
                Restaurant ID: {restaurantId}<br />
                Settings: Loaded<br />
                Restaurant Info: Loaded<br />
                Selected Date: {selectedDate || 'None'}<br />
                Selected Time: {selectedTime || 'None'}
              </div>
            )}

            {!restaurantId || !reservationSettings || !restaurantInfo ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading reservation system...</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  disabled={!restaurantId || !reservationSettings || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                {!restaurantId && (
                  <p className="text-xs text-red-500 mt-1">
                    Loading restaurant information...
                  </p>
                )}
                {!reservationSettings && restaurantId && (
                  <p className="text-xs text-red-500 mt-1">
                    Loading reservation settings...
                  </p>
                )}
                {reservationSettings && (
                  <p className="text-xs text-gray-500 mt-1">
                    Reservations can be made up to {reservationSettings.advanceBookingDays} days in advance
                  </p>
                )}
              </div>

              {/* Time Selection */}
              {selectedDate && reservationSettings && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-2" />
                    Select Time
                  </label>
                  {isCheckingAvailability ? (
                    <div className="flex items-center justify-center py-4">
                      <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 text-orange-500 animate-spin mr-2" />
                      <span className="text-gray-600">Checking availability...</span>
                    </div>
                  ) : availability?.timeSlots ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availability.timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => handleTimeSelect(slot.time)}
                          disabled={!slot.available}
                          className={`p-3 text-sm rounded-md border transition-colors ${
                            selectedTime === slot.time
                              ? 'bg-orange-500 text-white border-orange-500'
                              : slot.available
                              ? 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                          {!slot.available && (
                            <div className="text-xs mt-1">Full</div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No available time slots for this date</p>
                  )}
                </div>
              )}

              {/* Party Size */}
              {reservationSettings && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2" />
                    Party Size
                  </label>
                  <select
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    {Array.from({ length: reservationSettings.maxPartySize - reservationSettings.minPartySize + 1 }, (_, i) => 
                      reservationSettings.minPartySize + i
                    ).map(size => (
                      <option key={size} value={size}>
                        {size} {size === 1 ? 'person' : 'people'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Your Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faUtensils} className="w-4 h-4 mr-2" />
                    Special Requests
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Any special requests or dietary requirements..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedDate || !selectedTime || !restaurantId || !reservationSettings || isLoading}
                className="w-full py-3 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
                    Confirm Reservation
                  </>
                )}
                              </button>
              </form>
            )}
            </div>

          {/* Restaurant Information */}
          <div className="space-y-6">
            {!restaurantInfo || !reservationSettings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading restaurant information...</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Restaurant Details</h3>
                  <div className="space-y-3">
                    {restaurantInfo?.address && (
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Address</p>
                          <p className="text-sm text-gray-600">{restaurantInfo.address}</p>
                        </div>
                      </div>
                    )}
                    
                    {restaurantInfo?.phone && (
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Phone</p>
                          <p className="text-sm text-gray-600">{restaurantInfo.phone}</p>
                        </div>
                      </div>
                    )}

                    {reservationSettings && (
                      <>
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Hours</p>
                            <p className="text-sm text-gray-600">
                              {reservationSettings.openingTime} - {reservationSettings.closingTime}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Party Size</p>
                            <p className="text-sm text-gray-600">
                              {reservationSettings.minPartySize} - {reservationSettings.maxPartySize} people
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Reservation Policy */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Reservation Policy</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Please arrive 5-10 minutes before your reservation time</li>
                    <li>• Reservations are held for 15 minutes past the scheduled time</li>
                    <li>• Cancellations must be made at least 2 hours in advance</li>
                    <li>• Large parties may require a credit card hold</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
