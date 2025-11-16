"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useCart } from "@/hooks/useCart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheckCircle, faEnvelope, faClock } from "@fortawesome/free-solid-svg-icons";
import CustomerForm from "@/components/checkout/CustomerForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import PickupOptions from "@/components/checkout/PickupOptions";
import { CustomerFormData } from "@/types/checkout";
import { useRestaurantTiming } from '@/features/settings/hooks/useRestaurantTiming';
import { useOrderSubmission } from '@/hooks/useOrderSubmission';
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { clearCart } from "@/store/features/cartSlice";
import OrderConfirmationModal from "@/components/checkout/OrderConfirmationModal";

/**
 * CheckoutPage - One-page checkout flow
 * All customer inputs (contact info, pickup options, order summary) are visible
 * and editable within a single scrollable page for better UX
 */
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false); // Track order submission to prevent redirect
  const isSubmittingRef = useRef(false); // Ref for synchronous check to prevent redirect race condition

  // Timing helpers (opening hours, slots, ASAP availability)
  const timing = useRestaurantTiming({ restaurantDetails });
  
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

  // Order submission hook
  const { isSubmitting, submitOrder, resetOrder } = useOrderSubmission({
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

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantByDomain = async () => {
      try {
        setIsLoading(true);
        setError(null);

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

  // Redirect if cart is empty (but NOT if we're showing confirmation modal or submitting order)
  // This prevents immediate redirect after order submission
  // Uses both state and ref to prevent race conditions
  useEffect(() => {
    if (
      !isLoading && 
      cart.items.length === 0 && 
      !showConfirmation && 
      !placedOrder && 
      !isOrderSubmitting &&
      !isSubmittingRef.current
    ) {
      router.push(`/${domain}/menu`);
    }
  }, [cart.items.length, domain, isLoading, router, showConfirmation, placedOrder, isOrderSubmitting]);

  // Handle order submission
  const handleOrderSubmit = async (e?: MouseEvent<HTMLButtonElement>) => {
    // Prevent any default form submission behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Set submission flag immediately (both state and ref) to prevent redirect during processing
    // Using ref ensures synchronous check in redirect useEffect
    isSubmittingRef.current = true;
    setIsOrderSubmitting(true);

    try {
      // Validate form data
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error('Vennligst fyll ut alle kontaktdetaljer');
        isSubmittingRef.current = false;
        setIsOrderSubmitting(false);
        // Scroll to first empty field
        if (!formData.name.trim()) {
          document.getElementById('name')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          document.getElementById('name')?.focus();
        } else if (!formData.email.trim()) {
          document.getElementById('email')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          document.getElementById('email')?.focus();
        } else if (!formData.phone.trim()) {
          document.getElementById('phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          document.getElementById('phone')?.focus();
        }
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Vennligst oppgi en gyldig e-postadresse');
        isSubmittingRef.current = false;
        setIsOrderSubmitting(false);
        document.getElementById('email')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('email')?.focus();
        return;
      }

      // Validate phone number (only numbers, spaces, +, -, parentheses)
      const cleanedPhone = formData.phone.replace(/[\s\+\-\(\)]/g, '');
      if (!/^\d+$/.test(cleanedPhone)) {
        toast.error('Telefonnummer kan bare inneholde tall');
        isSubmittingRef.current = false;
        setIsOrderSubmitting(false);
        document.getElementById('phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('phone')?.focus();
        return;
      }
      if (cleanedPhone.length < 8) {
        toast.error('Telefonnummer må være minst 8 siffer');
        isSubmittingRef.current = false;
        setIsOrderSubmitting(false);
        document.getElementById('phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('phone')?.focus();
        return;
      }

      // Validate pickup options
      if (pickupOption === 'later') {
        if (!pickupDate) {
          toast.error('Vennligst velg en hentedato');
          isSubmittingRef.current = false;
          setIsOrderSubmitting(false);
          document.getElementById('pickup-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (!pickupTime) {
          toast.error('Vennligst velg en hentetid');
          isSubmittingRef.current = false;
          setIsOrderSubmitting(false);
          document.getElementById('pickup-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (!timing.isDateOpen(pickupDate)) {
          toast.error('Restauranten er stengt på valgt dato');
          isSubmittingRef.current = false;
          setIsOrderSubmitting(false);
          return;
        }
        if (!isTimeValid(pickupDate, pickupTime)) {
          toast.error('Valgt tid er i fortiden. Vennligst velg en fremtidig tid.');
          isSubmittingRef.current = false;
          setIsOrderSubmitting(false);
          return;
        }
      }

      if (cart.items.length === 0) {
        toast.error('Handlekurven din er tom');
        isSubmittingRef.current = false;
        setIsOrderSubmitting(false);
        return;
      }

      // Submit order - this will clear the cart internally
      const result = await submitOrder(formData);
      
      if (result?.success && result.orderData) {
        // CRITICAL: Set modal state IMMEDIATELY and SYNCHRONOUSLY
        // This must happen before any React re-renders or redirects
        // Using functional updates to ensure state is set correctly
        setPlacedOrder(result.orderData);
        setShowConfirmation(true);
        
        // Keep submission flag true to prevent redirect until modal is closed
        // The flag will be cleared when modal closes via handleCloseConfirmation
        
        // Force a small delay to ensure React has processed the state updates
        // This prevents any race conditions with the redirect useEffect
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Scroll to top to ensure modal is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // If order submission failed, reset submission flag
        isSubmittingRef.current = false;
        setIsOrderSubmitting(false);
        // Error toast already shown in submitOrder
        console.error('Order submission failed:', result);
      }
    } catch (error) {
      isSubmittingRef.current = false;
      setIsOrderSubmitting(false);
      toast.error('Kunne ikke legge inn bestilling. Vennligst prøv igjen.');
      console.error('Order submission error:', error);
    }
  };

  // Handle modal close - redirect to menu only after user closes the dialog
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    resetOrder();
    // Clear placed order state and submission flag (both state and ref)
    setPlacedOrder(null);
    isSubmittingRef.current = false;
    setIsOrderSubmitting(false);
    // Redirect to menu page after modal is closed
    // Small delay to ensure modal closes smoothly
    setTimeout(() => {
      router.push(`/${domain}/menu`);
    }, 100);
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
          <h1 className="text-2xl font-bold text-gray-700 mb-3">Restaurant Ikke Funnet</h1>
          <p className="text-gray-500 text-base">Restauranten du leter etter eksisterer ikke eller kan ha blitt flyttet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25 via-red-25 to-yellow-25">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 to-red-400 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/${domain}/menu`)}
              className="flex items-center justify-center w-10 h-10 text-white hover:text-orange-100 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Tilbake til meny"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center flex-1">
              {restaurantName}
            </h1>
            <div className="w-10"></div> {/* Spacer for centering (matches button width) */}
          </div>
        </div>
      </div>

      {/* Main Content - One Page Flow */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Form Sections (Scrollable) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information Section */}
            <section id="contact-section" className="bg-white rounded-2xl shadow-lg border border-orange-50 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-orange-500 mr-3" />
                  Kontaktinformasjon
                </h2>
                <p className="text-sm text-gray-600 mt-1">Vi trenger dine kontaktinfo for å bekrefte bestillingen din</p>
              </div>
              <div className="p-6">
                <div id="contact-section">
                  <CustomerForm formData={formData} setFormData={setFormData} />
                </div>
              </div>
            </section>

            {/* Pickup Options Section */}
            <section id="pickup-section" className="bg-white rounded-2xl shadow-lg border border-orange-50 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FontAwesomeIcon icon={faClock} className="w-5 h-5 text-orange-500 mr-3" />
                  Hentealternativer
                </h2>
                <p className="text-sm text-gray-600 mt-1">Velg hvordan du vil hente bestillingen din</p>
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
              </div>
            </section>
          </div>

          {/* Right Column - Order Summary (Sticky on Desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-50 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    Bestillingsoversikt
                  </h2>
                </div>
                <div className="p-6">
                  <OrderSummary cart={cart} />
                  
                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={(e) => handleOrderSubmit(e)}
                    disabled={isSubmitting || cart.items.length === 0 || isOrderSubmitting}
                    className={`w-full mt-6 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50 ${
                      isSubmitting || cart.items.length === 0 || isOrderSubmitting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                    }`}
                  >
                    {isSubmitting || isOrderSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Legger inn bestilling...
                      </span>
                    ) : (
                      'Bekreft Bestilling'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal - Renders when order is successfully placed */}
      {/* This modal appears for both ASAP and scheduled orders */}
      {/* Conditional rendering ensures modal only shows when all required data is available */}
      {showConfirmation && placedOrder && restaurantName && (
        <OrderConfirmationModal
          isOpen={showConfirmation}
          onClose={handleCloseConfirmation}
          order={placedOrder}
          restaurantName={restaurantName}
        />
      )}
    </div>
  );
}
