"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useCart } from "@/hooks/useCart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faArrowLeft, faCreditCard, faClock, faUser, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import CustomerForm from "@/components/checkout/CustomerForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import PickupOptions from "@/components/checkout/PickupOptions";
import { CustomerFormData } from "@/types/checkout";
import { useRestaurantTiming } from '@/hooks/useRestaurantTiming';
import { useOrderSubmission } from '@/hooks/useOrderSubmission';
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { clearCart } from "@/store/features/cartSlice";

export default function CheckoutPage() {
  const params = useParams();
  const domain = params.domain as string;
  const router = useRouter();
  const { cart } = useCart();
  const dispatch = useDispatch();
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantDetails, setRestaurantDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'pickup' | 'summary'>('form');
  const [pickupData, setPickupData] = useState<any>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  // Timing helpers (opening hours, slots, ASAP availability)
  const timing = useRestaurantTiming({ restaurantDetails });
  
  // Debug logging
  useEffect(() => {
    console.log('Restaurant Details:', restaurantDetails);
    console.log('Timing Hook Values:', timing);
  }, [restaurantDetails, timing]);
  
  // Destructure timing values for easier access
  const { 
    pickupOption, 
    setPickupOption, 
    pickupDate, 
    setPickupDate, 
    pickupTime, 
    setPickupTime,
    isTimeValid
  } = timing;

  // Order submission hook to persist order in Firestore
  const { isSubmitting, localPlacedOrder, submitOrder, resetOrder } = useOrderSubmission({
    restaurantId: restaurantId || '',
    pickupOption: pickupOption,
    pickupDate: pickupOption === 'asap' ? timing.pickupDate : (pickupDate || timing.pickupDate),
    pickupTime: pickupOption === 'asap' ? timing.pickupTime : (pickupTime || timing.pickupTime),
    isAsapAvailable: timing.isAsapAvailable,
    isDateOpen: timing.isDateOpen,
    getPickupTimeSlots: timing.getPickupTimeSlots
  });

  // Form data state
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    specialInstructions: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: ''
  });

  useEffect(() => {
    const fetchRestaurantByDomain = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query restaurants collection by domain
        const restaurantsQuery = query(
          collection(db, "restaurants"), 
          where("domain", "==", domain)
        );
        const querySnapshot = await getDocs(restaurantsQuery);
        
        if (querySnapshot.empty) {
          setError("Restaurant ikke funnet");
          return;
        }

        const restaurantDoc = querySnapshot.docs[0];
        const data = restaurantDoc.data();
        setRestaurantId(restaurantDoc.id);
        setRestaurantName(data.name || data.restaurantType || "Restaurant");
        setRestaurantDetails({
          restaurantId: restaurantDoc.id,
          openingHours: data.openingHours || [],
          name: data.name || data.restaurantType || "Restaurant"
        });
      } catch (error) {
        setError("Feil ved lasting av restaurant");
      } finally {
        setIsLoading(false);
      }
    };

    if (domain) {
      fetchRestaurantByDomain();
    }
  }, [domain]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoading && cart.items.length === 0) {
      router.push(`/${domain}/menu`);
    }
  }, [cart.items.length, domain, isLoading, router]);

  const handleFormSubmit = () => {
    // Validate form data
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Vennligst fyll ut alle kontaktdetaljer');
      return;
    }
    
    setCurrentStep('pickup');
  };

  const handlePickupSubmit = (pickupFormData: any) => {
    setPickupData(pickupFormData);
    setCurrentStep('summary');
  };

  const handleOrderConfirm = async () => {
    try {
      // Validate that we have all required data
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error('Please fill in all contact details');
        setCurrentStep('form');
        return;
      }

      if (!pickupData) {
        toast.error('Vennligst velg hentealternativer');
        setCurrentStep('pickup');
        return;
      }

      if (cart.items.length === 0) {
        toast.error('Handlekurven din er tom');
        return;
      }

      const result = await submitOrder(formData);
      if (result?.success) {
        setShowOrderDialog(true);
      }
    } catch (error) {
      toast.error('Kunne ikke legge inn bestilling. Vennligst prøv igjen.');
    }
  };

  const handleBackToMenu = () => {
    router.push(`/${domain}/menu`);
  };

  const handleCloseOrderDialog = () => {
    setShowOrderDialog(false);
    resetOrder();
    router.push(`/${domain}/menu`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-25 via-red-25 to-yellow-25 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-base font-semibold">Laster utsjekk...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-25 via-red-25 to-yellow-25 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-full mb-4">
            <FontAwesomeIcon icon={faUtensils} className="h-12 w-12 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-3">Restaurant Ikke Funnet</h1>
          <p className="text-gray-500 text-base">Restauranten du leter etter eksisterer ikke eller kan ha blitt flyttet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25 via-red-25 to-yellow-25">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 to-red-400 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToMenu}
              className="flex items-center text-white hover:text-orange-100 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Tilbake til Meny</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center">
              {restaurantName}
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${currentStep === 'form' ? 'text-orange-600' : currentStep === 'pickup' || currentStep === 'summary' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'form' ? 'bg-orange-500 text-white' : 
                currentStep === 'pickup' || currentStep === 'summary' ? 'bg-green-500 text-white' : 
                'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">Detaljer</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'pickup' || currentStep === 'summary' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'pickup' ? 'text-orange-600' : currentStep === 'summary' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'pickup' ? 'bg-orange-500 text-white' : 
                currentStep === 'summary' ? 'bg-green-500 text-white' : 
                'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">Henting</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'summary' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'summary' ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'summary' ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">Gjennomgang</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 'form' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-orange-50 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-orange-500 mr-3" />
                      Kontaktinformasjon
                    </h2>
                  </div>
                  <div className="p-6">
                    <CustomerForm formData={formData} setFormData={setFormData} />
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleFormSubmit}
                        className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                      >
                        Fortsett til Hentealternativer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-orange-50 overflow-hidden sticky top-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-orange-500 mr-3" />
                      Bestillingsoversikt
                    </h2>
                  </div>
                  <div className="p-6">
                    <OrderSummary cart={cart} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'pickup' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Pickup Options */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-orange-50 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <FontAwesomeIcon icon={faClock} className="w-5 h-5 text-orange-500 mr-3" />
                      Hentealternativer
                    </h2>
                  </div>
                  <div className="p-6">
                    <PickupOptions 
                      pickupOption={pickupOption}
                      setPickupOption={setPickupOption}
                      isAsapAvailable={timing.isAsapAvailable}
                      pickupDate={pickupDate}
                      setPickupDate={setPickupDate}
                      pickupTime={pickupTime}
                      setPickupTime={setPickupTime}
                      availableDates={timing.getAvailableDates()}
                      availablePickupTimes={timing.availablePickupTimes}
                      isDateOpen={timing.isDateOpen}
                      restaurantDetails={restaurantDetails || {}}
                      isTimeValid={isTimeValid}
                    />
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          // Validate pickup options before proceeding
                          if (pickupOption === 'later') {
                            if (!pickupDate) {
                              toast.error('Vennligst velg en hentedato');
                              return;
                            }
                            if (!pickupTime) {
                              toast.error('Vennligst velg en hentetid');
                              return;
                            }
                            if (!timing.isDateOpen(pickupDate)) {
                              toast.error('Restauranten er stengt på valgt dato');
                              return;
                            }
                            if (timing.availablePickupTimes.length === 0) {
                              toast.error('Ingen tilgjengelige hentetider for valgt dato');
                              return;
                            }
                            if (!isTimeValid(pickupDate, pickupTime)) {
                              toast.error('Valgt tid er i fortiden. Vennligst velg en fremtidig tid.');
                              return;
                            }
                          }
                          
                          const pickupFormData = {
                            pickupOption,
                            pickupDate: pickupOption === 'asap' ? timing.pickupDate : pickupDate,
                            pickupTime: pickupOption === 'asap' ? 'As Soon As Possible' : pickupTime
                          };
                          handlePickupSubmit(pickupFormData);
                        }}
                        disabled={pickupOption === 'later' && (!pickupDate || !pickupTime || !timing.isDateOpen(pickupDate) || timing.availablePickupTimes.length === 0 || !isTimeValid(pickupDate, pickupTime))}
                        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50 ${
                          pickupOption === 'later' && (!pickupDate || !pickupTime || !timing.isDateOpen(pickupDate) || timing.availablePickupTimes.length === 0 || !isTimeValid(pickupDate, pickupTime))
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                        }`}
                      >
                        Fortsett til Gjennomgang
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-orange-50 overflow-hidden sticky top-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-orange-500 mr-3" />
                      Bestillingsoversikt
                    </h2>
                  </div>
                  <div className="p-6">
                    <OrderSummary cart={cart} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'summary' && (
            <div className="bg-white rounded-2xl shadow-lg border border-orange-50 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-orange-500 mr-3" />
                  Gjennomgå Bestillingen Din
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-orange-500 mr-2" />
                      Kontaktdetaljer
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Navn:</strong> {formData?.name}</p>
                      <p><strong>Telefon:</strong> {formData?.phone}</p>
                      <p><strong>E-post:</strong> {formData?.email}</p>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6 flex items-center">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-orange-500 mr-2" />
                      Hentedetaljer
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Alternativ:</strong> {pickupData?.pickupOption === 'asap' ? 'Så snart som mulig' : 'Planlagt'}</p>
                      {pickupData?.pickupOption === 'later' && (
                        <>
                          <p><strong>Dato:</strong> {pickupData?.pickupDate}</p>
                          <p><strong>Tid:</strong> {pickupData?.pickupTime}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <OrderSummary cart={cart} />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentStep('form')}
                    className="flex-1 px-6 py-3 border border-orange-300 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
                  >
                    Tilbake til Redigering
                  </button>
                  <button
                    onClick={handleOrderConfirm}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Bekreft Bestilling
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simple Order Confirmation Dialog */}
      {showOrderDialog && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 backdrop-blur-sm bg-black/30" onClick={handleCloseOrderDialog} />
          
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Bestilling Mottatt!</h1>
                <p className="text-green-100">Bestillingen din har blitt mottatt av restauranten</p>
              </div>

              <div className="p-6">
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Hva skjer nå?</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>✓ Restauranten vil bekrefte bestillingen din</p>
                      {pickupData?.pickupOption === 'asap' ? (
                        <p>✓ Hentetid vil bli varslet via e-post</p>
                      ) : (
                        <p>✓ Bestilling planlagt for {pickupData?.pickupTime}</p>
                      )}
                      <p>✓ Du vil motta e-postbekreftelse</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseOrderDialog}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50"
                  >
                    Tilbake til Meny
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 