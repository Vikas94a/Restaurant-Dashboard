"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faEnvelope, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Order } from "@/types/checkout";
import { useEffect } from "react";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  restaurantName: string;
}

/**
 * OrderConfirmationModal - Professional confirmation window after order submission
 * Displays restaurant name, confirmation message, and next steps
 * Appears after successful order submission for both ASAP and scheduled orders
 */
export default function OrderConfirmationModal({
  isOpen,
  onClose,
  order,
  restaurantName,
}: OrderConfirmationModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine pickup time display
  const displayPickupTime = order.pickupOption === 'asap' 
    ? 'Så snart som mulig' 
    : order.pickupTime || 'Skal bestemmes';

  return (
    <>
      {/* Backdrop - clickable to close modal */}
      <div 
        className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        onClick={(e) => {
          // Close modal if clicking on the backdrop (not the modal content)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Header with Animation */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-8 text-center relative overflow-hidden">
            {/* Animated background circles */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 bg-white rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 right-4 w-24 h-24 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            
            <div className="relative z-10">
              {/* Animated Checkmark */}
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <FontAwesomeIcon 
                  icon={faCheckCircle} 
                  className="w-12 h-12 text-green-500 animate-checkmark" 
                />
              </div>
              
              <h1 
                id="confirmation-title"
                className="text-2xl font-bold text-white mb-2 animate-fade-in"
              >
                Bestilling Mottatt!
              </h1>
              <p className="text-green-100 text-base animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {restaurantName} har mottatt bestillingen din
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Main Message */}
            <div className="text-center space-y-4">
              <p className="text-gray-700 text-base leading-relaxed font-medium px-2">
                Din bestilling har blitt mottatt av <strong>{restaurantName}</strong>.
              </p>
              
              {/* Email Confirmation Notice */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      E-postbekreftelse
                    </p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Du vil motta en e-postbekreftelse kort tid. Sjekk spam-mappen hvis du ikke ser den.
                    </p>
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      {order.customerDetails.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bestillingsnummer:</span>
                  <span className="font-semibold text-gray-800">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hentetid:</span>
                  <span className="font-semibold text-gray-800">{displayPickupTime}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Totalt:</span>
                  <span className="font-bold text-lg text-orange-600">{order.total.toFixed(2)} kr</span>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 text-left">
                <p className="text-sm font-semibold text-orange-900 mb-2">
                  Hva skjer nå?
                </p>
                <ul className="text-xs text-orange-800 space-y-1 list-disc list-inside">
                  <li>Restauranten vil bekrefte bestillingen din</li>
                  {order.pickupOption === 'asap' ? (
                    <li>Du vil motta en melding når bestillingen er klar</li>
                  ) : (
                    <li>Bestilling planlagt for {displayPickupTime}</li>
                  )}
                  <li>Du vil motta e-postbekreftelse med alle detaljer</li>
                </ul>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:ring-opacity-50"
            >
              Tilbake til Meny
            </button>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkmark {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-checkmark {
          animation: checkmark 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
}

