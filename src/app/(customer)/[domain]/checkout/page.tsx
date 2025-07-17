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
  const [pickupOption, setPickupOption] = useState<'asap' | 'later'>('asap');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [showOrderDialog, setShowOrderDialog] = useState(false);

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
          setError("Restaurant not found");
          return;
        }

        const restaurantDoc = querySnapshot.docs[0];
        const data = restaurantDoc.data();
        setRestaurantId(restaurantDoc.id);
        setRestaurantName(data.name || data.restaurantType || "Restaurant");
        setRestaurantDetails({
          openingHours: data.openingHours || [],
          name: data.name || data.restaurantType || "Restaurant"
        });
      } catch (error) {
        setError("Error Loading Restaurant");
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
      toast.error('Please fill in all contact details');
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
        toast.error('Please select pickup options');
        setCurrentStep('pickup');
        return;
      }

      if (cart.items.length === 0) {
        toast.error('Your cart is empty');
        return;
      }

      // Clear cart and show success dialog
      dispatch(clearCart());
      setShowOrderDialog(true);
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    }
  };

  const handleBackToMenu = () => {
    router.push(`/${domain}/menu`);
  };

  const handleCloseOrderDialog = () => {
    setShowOrderDialog(false);
    router.push(`/${domain}/menu`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-25 via-red-25 to-yellow-25 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-base font-semibold">Loading checkout...</p>
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
          <h1 className="text-2xl font-bold text-gray-700 mb-3">Restaurant Not Found</h1>
          <p className="text-gray-500 text-base">The restaurant you're looking for doesn't exist or may have been moved.</p>
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
              <span className="text-sm font-medium">Back to Menu</span>
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
              <span className="ml-2 text-sm font-medium hidden sm:block">Details</span>
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
              <span className="ml-2 text-sm font-medium hidden sm:block">Pickup</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'summary' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'summary' ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'summary' ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">Review</span>
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
                      Contact Information
                    </h2>
                  </div>
                  <div className="p-6">
                    <CustomerForm formData={formData} setFormData={setFormData} />
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleFormSubmit}
                        className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                      >
                        Continue to Pickup Options
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
                      Order Summary
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
                      Pickup Options
                    </h2>
                  </div>
                  <div className="p-6">
                    <PickupOptions 
                      pickupOption={pickupOption}
                      setPickupOption={setPickupOption}
                      isAsapAvailable={true}
                      pickupDate={pickupDate}
                      setPickupDate={setPickupDate}
                      pickupTime={pickupTime}
                      setPickupTime={setPickupTime}
                      availableDates={[
                        { date: '2024-01-15', display: 'Today' },
                        { date: '2024-01-16', display: 'Tomorrow' },
                        { date: '2024-01-17', display: 'Wednesday' }
                      ]}
                      availablePickupTimes={['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM']}
                      isDateOpen={() => true}
                      restaurantDetails={restaurantDetails || {}}
                    />
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          const pickupFormData = {
                            pickupOption,
                            pickupDate: pickupOption === 'asap' ? new Date().toISOString().split('T')[0] : pickupDate,
                            pickupTime: pickupOption === 'asap' ? 'As Soon As Possible' : pickupTime
                          };
                          handlePickupSubmit(pickupFormData);
                        }}
                        disabled={pickupOption === 'later' && (!pickupDate || !pickupTime)}
                        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50 ${
                          pickupOption === 'later' && (!pickupDate || !pickupTime)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                        }`}
                      >
                        Continue to Review
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
                      Order Summary
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
                  Review Your Order
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-orange-500 mr-2" />
                      Contact Details
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Name:</strong> {formData?.name}</p>
                      <p><strong>Phone:</strong> {formData?.phone}</p>
                      <p><strong>Email:</strong> {formData?.email}</p>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6 flex items-center">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-orange-500 mr-2" />
                      Pickup Details
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Option:</strong> {pickupData?.pickupOption === 'asap' ? 'As Soon As Possible' : 'Scheduled'}</p>
                      {pickupData?.pickupOption === 'later' && (
                        <>
                          <p><strong>Date:</strong> {pickupData?.pickupDate}</p>
                          <p><strong>Time:</strong> {pickupData?.pickupTime}</p>
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
                    Back to Edit
                  </button>
                  <button
                    onClick={handleOrderConfirm}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Confirm Order
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
                <h1 className="text-2xl font-bold text-white mb-2">Order Received!</h1>
                <p className="text-green-100">Your order has been received by the restaurant</p>
              </div>

              <div className="p-6">
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">What's Next?</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>✓ Restaurant will confirm your order</p>
                      {pickupData?.pickupOption === 'asap' ? (
                        <p>✓ Pickup time will be notified by email</p>
                      ) : (
                        <p>✓ Order scheduled for {pickupData?.pickupTime}</p>
                      )}
                      <p>✓ You'll receive email confirmation</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseOrderDialog}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50"
                  >
                    Back to Menu
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