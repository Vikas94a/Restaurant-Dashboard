"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ReservationService } from '@/services/reservationService';
import { ReservationSettings, AvailabilityResponse, CreateReservationRequest } from '@/types/reservation';
import { RestaurantDetails } from '@/types/checkout';
import { useReservationTiming } from '@/hooks/useReservationTiming';
import ReservationCalendar from '@/components/reservation/ReservationCalendar';
import ReservationTimeSelector from '@/components/reservation/ReservationTimeSelector';
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
  
  
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [reservationSettings, setReservationSettings] = useState<ReservationSettings | null>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Use the new reservation timing hook
  const timing = useReservationTiming({ restaurantDetails, reservationSettings });
  const { 
    selectedDate, 
    setSelectedDate, 
    selectedTime, 
    setSelectedTime, 
    isDateOpen, 
    getAvailableDates, 
    getTimeSlots, 
    isTimeValid 
  } = timing;

  useEffect(() => {
    if (domain && domain.trim() !== '') {
      loadRestaurantData();
    }
  }, [domain]);



  const loadRestaurantData = async () => {
    try {
      setIsLoading(true);
      
      if (!domain) {
        toast.error('Invalid restaurant URL');
        return;
      }
      
      // Get restaurant by domain
      const restaurantsRef = collection(db, 'restaurants');
      const q = query(restaurantsRef, where('domain', '==', domain));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Restaurant not found');
        return;
      }

      const restaurantDoc = querySnapshot.docs[0];
      const restaurantData = restaurantDoc.data();
      
      // Validate restaurant data
      if (!restaurantData.name) {
        toast.error('Restaurant information is incomplete');
        return;
      }
      
      // Set restaurant ID
      setRestaurantId(restaurantDoc.id);
      
      setRestaurantInfo({
        name: restaurantData.name || 'Restaurant',
        description: restaurantData.description,
        address: restaurantData.address,
        phone: restaurantData.phone,
        email: restaurantData.email,
        logo: restaurantData.logo
      });

      // Set restaurant details for timing logic
      setRestaurantDetails({
        restaurantId: restaurantDoc.id,
        openingHours: restaurantData.openingHours || [],
        name: restaurantData.name || 'Restaurant'
      });

      // Load reservation settings
      const settings = await ReservationService.getReservationSettings(restaurantDoc.id);
      
      setReservationSettings(settings);
      
      if (!settings?.enabled) {
        toast.error('Reservations are not currently available at this restaurant');
        return;
      }
      
      // Check if settings have all required fields
      if (!settings.timeSlotInterval || !settings.maxReservationsPerTimeSlot) {
        toast.error('Reservation settings are incomplete. Please contact the restaurant.');
        return;
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      toast.error('Failed to load restaurant information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantId || !reservationSettings || !selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate time selection
    if (!isTimeValid(selectedDate, selectedTime)) {
      toast.error('Selected time is in the past. Please choose a future time.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const reservationRequest: CreateReservationRequest = {
        restaurantId: restaurantId,
        domain,
        customerDetails: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          ...(specialRequests && { specialRequests })
        },
        reservationDetails: {
          date: selectedDate,
          time: selectedTime,
          partySize
        }
      };

      const reservation = await ReservationService.createReservation(reservationRequest);
      
      toast.success('Reservation submitted successfully!');
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSpecialRequests('');
      setPartySize(2);
      
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || 'Failed to submit reservation');
    } finally {
      setIsSubmitting(false);
    }
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
            

            {!restaurantId || !reservationSettings || !restaurantInfo ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading reservation system...</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <ReservationCalendar
                availableDates={getAvailableDates()}
                selectedDate={selectedDate}
                onDateSelect={handleDateChange}
                isDateOpen={isDateOpen}
                restaurantDetails={restaurantDetails}
              />

              {/* Time Selection */}
              {selectedDate && reservationSettings && (
                <ReservationTimeSelector
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSelect}
                  availableTimes={getTimeSlots(selectedDate)}
                  isTimeValid={isTimeValid}
                  restaurantDetails={restaurantDetails}
                />
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
                disabled={isSubmitting || !selectedDate || !selectedTime || !restaurantId || !reservationSettings || isLoading || !isTimeValid(selectedDate, selectedTime)}
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
                              Based on restaurant operating hours
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
