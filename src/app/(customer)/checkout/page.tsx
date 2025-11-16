"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CustomerFormData, RestaurantDetails } from '@/types/checkout';
import CustomerForm from '@/components/checkout/CustomerForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import PickupOptions from '@/components/checkout/PickupOptions';
import { useRestaurantTiming } from '@/features/settings/hooks/useRestaurantTiming';
import { useOrderSubmission } from '@/hooks/useOrderSubmission';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function CheckoutPage() {
  const { cart } = useCart();
  const router = useRouter();
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  
  const restaurantId = cart.items[0]?.restaurantId;
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    specialInstructions: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: ''
  });

  // Custom hooks
  const timing = useRestaurantTiming({ restaurantDetails });
  const { isTimeValid } = timing;
  const { isSubmitting, localPlacedOrder, submitOrder, resetOrder } = useOrderSubmission({
    restaurantId: restaurantId || '',
    pickupOption: timing.pickupOption,
    pickupDate: timing.pickupDate,
    pickupTime: timing.pickupTime,
    isAsapAvailable: timing.isAsapAvailable,
    isDateOpen: timing.isDateOpen,
    getPickupTimeSlots: timing.getPickupTimeSlots
  });

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (!restaurantId) { 
        setIsLoading(false); 
        return; 
      }
      
      try {
        const restaurantRef = doc(db, "restaurants", restaurantId);
        const restaurantDoc = await getDoc(restaurantRef);
        
        if (restaurantDoc.exists()) {
          const data = restaurantDoc.data();
          setRestaurantDetails({
            restaurantId: restaurantId,
            openingHours: data.openingHours || [],
            name: data.name || data.restaurantType || "Restaurant"
          });
        }
      } catch (error) {
        toast.error("Kunne ikke laste restaurantdetaljer");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [restaurantId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate pickup options
    if (timing.pickupOption === 'later') {
      if (!timing.pickupDate) {
        toast.error('Vennligst velg en hentedato');
        return;
      }
      if (!timing.pickupTime) {
        toast.error('Vennligst velg en hentetid');
        return;
      }
      if (!timing.isDateOpen(timing.pickupDate)) {
        toast.error('Restauranten er stengt på valgt dato');
        return;
      }
      if (timing.availablePickupTimes.length === 0) {
        toast.error('Ingen tilgjengelige hentetider for valgt dato');
        return;
      }
      if (!isTimeValid(timing.pickupDate, timing.pickupTime)) {
        toast.error('Valgt tid er i fortiden. Vennligst velg en fremtidig tid.');
        return;
      }
    }
    
    const result = await submitOrder(formData);
    if (result?.success) {
      setShowOrderStatus(true);
    }
  };

  // Handle return to menu
  const onReturnToMenu = () => {
    setShowOrderStatus(false);
    resetOrder();
    router.push(`/restaurant/${restaurantId || ''}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (!restaurantDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Restaurant ikke funnet</h2>
          <p className="text-gray-600">Kunne ikke laste restaurantdetaljer. Vennligst prøv igjen senere.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dine detaljer</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <CustomerForm formData={formData} setFormData={setFormData} />
              
              <PickupOptions
                pickupOption={timing.pickupOption}
                setPickupOption={timing.setPickupOption}
                isAsapAvailable={timing.isAsapAvailable}
                pickupDate={timing.pickupDate}
                setPickupDate={timing.setPickupDate}
                pickupTime={timing.pickupTime}
                setPickupTime={timing.setPickupTime}
                availableDates={timing.getAvailableDates()}
                availablePickupTimes={timing.availablePickupTimes}
                isDateOpen={timing.isDateOpen}
                restaurantDetails={restaurantDetails}
                isTimeValid={isTimeValid}
              />

              <button
                type="submit"
                disabled={isSubmitting || (timing.pickupOption === 'later' && (!timing.pickupDate || !timing.pickupTime || !timing.isDateOpen(timing.pickupDate) || timing.availablePickupTimes.length === 0 || !isTimeValid(timing.pickupDate, timing.pickupTime)))}
                className={`w-full mt-6 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                  isSubmitting || (timing.pickupOption === 'later' && (!timing.pickupDate || !timing.pickupTime || !timing.isDateOpen(timing.pickupDate) || timing.availablePickupTimes.length === 0 || !isTimeValid(timing.pickupDate, timing.pickupTime)))
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark cursor-pointer'
                }`}
              >
                {isSubmitting ? 'Plasserer bestilling...' : 'Plasser bestilling'}
              </button>
            </form>
          </div>
          
          <OrderSummary 
            cart={cart} 
          />
        </div>
        
        {/* Simple Order Confirmation Dialog */}
        {localPlacedOrder && showOrderStatus && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 backdrop-blur-sm bg-black/30" onClick={onReturnToMenu} />
            
            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-8 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Bestilling mottatt!</h1>
                  <p className="text-green-100">Din bestilling er mottatt av restauranten</p>
                </div>

                <div className="p-6">
                  <div className="text-center space-y-4">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Hva skjer nå?</h3>
                      <div className="space-y-2 text-sm text-blue-800">
                        <p>✓ Restauranten vil bekrefte din bestilling</p>
                        {timing.pickupOption === 'asap' ? (
                          <p>✓ Hentetid vil bli varslet via e-post</p>
                        ) : (
                          <p>✓ Bestilling planlagt for {timing.pickupTime}</p>
                        )}
                        <p>✓ Du vil motta e-postbekreftelse</p>
                      </div>
                    </div>

                    <button
                      onClick={onReturnToMenu}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50"
                    >
                      Tilbake til meny
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}