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
        toast.error('Ugyldig restaurant URL');
        return;
      }
      
      // Get restaurant by domain
      const restaurantsRef = collection(db, 'restaurants');
      const q = query(restaurantsRef, where('domain', '==', domain));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Restaurant ikke funnet');
        return;
      }

      const restaurantDoc = querySnapshot.docs[0];
      const restaurantData = restaurantDoc.data();
      
      // Validate restaurant data
      if (!restaurantData.name) {
        toast.error('Restaurantinformasjon er ufullstendig');
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
        toast.error('Reservasjoner er ikke tilgjengelige på denne restauranten for øyeblikket');
        return;
      }
      
      // Check if settings have all required fields
      if (!settings.timeSlotInterval || !settings.maxReservationsPerTimeSlot) {
        toast.error('Reservasjonsinnstillinger er ufullstendige. Vennligst kontakt restauranten.');
        return;
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      toast.error('Kunne ikke laste restaurantinformasjon');
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
      toast.error('Vennligst velg dato og tid');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Vennligst fyll ut alle påkrevde felt');
      return;
    }

    // Validate time selection
    if (!isTimeValid(selectedDate, selectedTime)) {
      toast.error('Valgt tid er i fortiden. Vennligst velg en fremtidig tid.');
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
      
      toast.success('Reservasjon sendt inn vellykket!');
      
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
      toast.error(error.message || 'Kunne ikke sende inn reservasjon');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!domain) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faTimes} className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ugyldig URL</h1>
          <p className="text-gray-600">Vennligst sjekk restaurant URL-en og prøv igjen.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster restaurantinformasjon...</p>
        </div>
      </div>
    );
  }

  if (!reservationSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laster Reservasjonssystem</h1>
          <p className="text-gray-600">
            Vennligst vent mens vi laster reservasjonsinnstillingene...
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reservasjoner Ikke Tilgjengelig</h1>
          <p className="text-gray-600">
            Denne restauranten tar ikke imot reservasjoner for øyeblikket. Vennligst kontakt dem direkte for bestillingshenvendelser.
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laster Restaurantinformasjon</h1>
          <p className="text-gray-600">
            Vennligst vent mens vi laster restaurantdetaljene...
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laster Restaurant ID</h1>
          <p className="text-gray-600">
            Vennligst vent mens vi laster restaurantidentifikatoren...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {restaurantInfo?.logo && (
                <div className="relative">
                  <img 
                    src={restaurantInfo.logo} 
                    alt={restaurantInfo.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg ring-4 ring-white/50"
                  />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {restaurantInfo?.name}
                </h1>
                {restaurantInfo?.description && (
                  <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-md">{restaurantInfo.description}</p>
                )}
                <div className="flex items-center justify-center sm:justify-start mt-3 space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUtensils} className="w-4 h-4 mr-1" />
                    <span>Finere Spisesteder</span>
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-1" />
                    <span>Reservasjoner Tilgjengelig</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Reservation Form */}
          <div className="xl:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Bestill Bord</h2>
                  <p className="text-gray-600 mt-1">Bestill ditt perfekte bord hos oss</p>
                </div>
              </div>
            

            {!restaurantId || !reservationSettings || !restaurantInfo ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Laster reservasjonssystem...</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date & Time Selection */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 text-orange-600 mr-2" />
                  Velg Dato og Tid
                </h3>
                
                {/* Date Selection */}
                <div className="mb-6">
                  <ReservationCalendar
                    availableDates={getAvailableDates()}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateChange}
                    isDateOpen={isDateOpen}
                    restaurantDetails={restaurantDetails}
                  />
                </div>

                {/* Time Selection */}
                {selectedDate && reservationSettings && (
                  <div className="mb-6">
                    <ReservationTimeSelector
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onTimeSelect={handleTimeSelect}
                      availableTimes={getTimeSlots(selectedDate)}
                      isTimeValid={isTimeValid}
                      restaurantDetails={restaurantDetails}
                    />
                  </div>
                )}

                {/* Party Size */}
                {reservationSettings && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2 text-orange-600" />
                      Antall Personer
                    </label>
                    <select
                      value={partySize}
                      onChange={(e) => setPartySize(Number(e.target.value))}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                      required
                    >
                      {Array.from({ length: reservationSettings.maxPartySize - reservationSettings.minPartySize + 1 }, (_, i) => 
                        reservationSettings.minPartySize + i
                      ).map(size => (
                        <option key={size} value={size}>
                          {size} {size === 1 ? 'person' : 'personer'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-orange-600 mr-2" />
                  Din Informasjon
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fullt Navn *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                      placeholder="Skriv inn ditt fulle navn"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-postadresse *
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonnummer *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                      placeholder="+47 47 00 00 00"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spesielle Ønsker
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={4}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm resize-none"
                      placeholder="Eventuelle spesielle ønsker, diettkrav eller feiringsdetaljer..."
                    />
                  </div>
                </div>

                {/* Privacy Policy Notice */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <FontAwesomeIcon icon={faEnvelope} className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Personvern og samtykke</p>
                      <p className="text-xs leading-relaxed">
                        Ved å legge inn reservasjon godtar du vår{' '}
                        <a 
                          href="/personvern" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-900 transition-colors font-medium"
                        >
                          personvernerklæring
                        </a>
                        {' '}og samtykker til behandling av dine personlige opplysninger for å fullføre reservasjonen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedTime || !restaurantId || !reservationSettings || isLoading || !isTimeValid(selectedDate, selectedTime)}
                  className="w-full py-4 px-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin mr-3" />
                      Sender inn Reservasjon...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="w-5 h-5 mr-3" />
                      Bekreft Reservasjon
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Du vil motta en bekreftelses-e-post kort tid etter bestilling
                </p>
              </div>
              </form>
            )}
            </div>
          </div>

          {/* Restaurant Information Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {!restaurantInfo || !reservationSettings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Laster restaurantinformasjon...</p>
              </div>
            ) : (
              <>
                {/* Restaurant Details Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <FontAwesomeIcon icon={faUtensils} className="w-5 h-5 text-orange-600 mr-2" />
                    Restaurantdetaljer
                  </h3>
                  <div className="space-y-4">
                    {restaurantInfo?.address && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mt-0.5">
                          <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Adresse</p>
                          <p className="text-sm text-gray-600 mt-1">{restaurantInfo.address}</p>
                        </div>
                      </div>
                    )}
                    
                    {restaurantInfo?.phone && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mt-0.5">
                          <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Telefon</p>
                          <p className="text-sm text-gray-600 mt-1">{restaurantInfo.phone}</p>
                        </div>
                      </div>
                    )}

                    {reservationSettings && (
                      <>
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mt-0.5">
                            <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Operating Hours</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Based on restaurant schedule
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mt-0.5">
                            <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Party Size</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {reservationSettings.minPartySize} - {reservationSettings.maxPartySize} people
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Reservation Policy */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
                    Reservasjonsregler
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-3">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Vennligst kom 5-10 minutter før reservasjonstiden</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Reservasjoner holdes i 15 minutter etter planlagt tid</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Avbestillinger må gjøres minst 2 timer i forveien</span>
                    </li>
                  
                  </ul>
                </div>

                {/* Quick Contact */}
                {restaurantInfo?.phone && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h4 className="font-bold text-green-900 mb-3 flex items-center">
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2" />
                      Trenger Hjelp?
                    </h4>
                    <p className="text-sm text-green-800 mb-4">
                      Har du spørsmål om reservasjonen din? Ring oss!
                    </p>
                    <a 
                      href={`tel:${restaurantInfo.phone}`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2" />
                      Ring Restaurant
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
