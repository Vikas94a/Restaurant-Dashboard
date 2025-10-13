"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { NestedMenuItem, ReusableExtraGroup } from "@/utils/menuTypes";
import Image from 'next/image';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NestedMenuItem;
  extras: ReusableExtraGroup[];
  onAddToCart: (options: {
    selectedExtras: { groupId: string; choiceId: string }[];
    specialRequest: string;
    totalPrice: number;
  }) => void;
}

export default function AddToCartModal({
  isOpen,
  onClose,
  item,
  extras,
  onAddToCart,
}: AddToCartModalProps) {
  const [selected, setSelected] = useState<{ [groupId: string]: Set<string> }>({});
  const [specialRequest, setSpecialRequest] = useState("");
  const [total, setTotal] = useState(item.price.amount);
  const [validationError, setValidationError] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus management and reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelected({});
      setSpecialRequest("");
      setValidationError(null);
      
      if (closeBtnRef.current) {
        closeBtnRef.current.focus();
      }
    }
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Price calculation
  useEffect(() => {
    let extrasTotal = 0;
    for (const group of extras) {
      const selectedChoices = selected[group.id] || new Set();
      for (const choiceId of Array.from(selectedChoices)) {
        const choice = group.choices.find(c => c.id === choiceId);
        if (choice) extrasTotal += choice.price;
      }
    }
    setTotal(item.price.amount + extrasTotal);
  }, [selected, extras, item.price.amount]);

  if (!isOpen) return null;

  const toggleChoice = (group: ReusableExtraGroup, choiceId: string) => {
    setSelected(prev => {
      const groupChoices = prev[group.id] ? new Set<string>(prev[group.id]) : new Set<string>();
      if (group.selectionType === "single") {
        groupChoices.clear();
        groupChoices.add(choiceId);
      } else {
        if (groupChoices.has(choiceId)) {
          groupChoices.delete(choiceId);
        } else {
          groupChoices.add(choiceId);
        }
      }
      return { ...prev, [group.id]: groupChoices };
    });
    // Clear validation error when user makes a selection
    setValidationError(null);
  };

  // Validate required fields
  const validateRequiredFields = (): boolean => {
    for (const group of extras) {
      if (group.required) {
        const selectedChoices = selected[group.id];
        if (!selectedChoices || selectedChoices.size === 0) {
          setValidationError(`Please select an option for "${group.groupName}"`);
          return false;
        }
      }
    }
    setValidationError(null);
    return true;
  };

  // Check if all required fields are filled
  const canAddToCart = (): boolean => {
    for (const group of extras) {
      if (group.required) {
        const selectedChoices = selected[group.id];
        if (!selectedChoices || selectedChoices.size === 0) {
          return false;
        }
      }
    }
    return true;
  };

  // For accessibility: ARIA labels
  const labelId = `add-to-cart-label-${item.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      ref={dialogRef}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header with image, name, description */}
        <div className="relative flex-shrink-0">
          <div className="relative h-32 sm:h-40 w-full">
            <Image
              src={item.imageUrl || '/placeholder.jpg'}
              alt={item.name}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1.5 sm:p-2 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <h2 id={labelId} className="text-xl sm:text-2xl font-bold mb-1 text-gray-800">{item.name}</h2>
          {item.description && <p className="text-gray-600 mb-4 text-sm sm:text-base">{item.description}</p>}

          {/* Special request */}
          <div className="mb-4 sm:mb-6">
            <label htmlFor="special-request" className="block font-medium text-gray-800 mb-2 text-sm sm:text-base">
              Special request
            </label>
            <textarea
              id="special-request"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={2}
              placeholder="e.g., No onions, please"
              value={specialRequest}
              onChange={e => setSpecialRequest(e.target.value)}
            />
          </div>

          {/* Extras section with proper scrolling */}
          {extras.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Extras & Add-ons</h3>
              <div className="space-y-4 max-h-60 sm:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {extras.map(group => {
                  const hasSelection = selected[group.id] && selected[group.id].size > 0;
                  const isRequired = group.required;
                  const showError = isRequired && !hasSelection && validationError;
                  
                  return (
                    <div 
                      key={group.id} 
                      className={`border rounded-lg p-3 ${
                        showError 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-700 mb-2 text-sm sm:text-base flex items-center gap-2">
                        {group.groupName}
                        {isRequired && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {group.choices.map(choice => (
                          <label key={choice.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-md transition-colors">
                            <input
                              type={group.selectionType === "single" ? "radio" : "checkbox"}
                              name={`extra-${group.id}`}
                              checked={!!selected[group.id]?.has(choice.id)}
                              onChange={() => toggleChoice(group, choice.id)}
                              className="w-4 h-4 text-orange-500 focus:ring-orange-500 focus:ring-2"
                            />
                            <span className="flex-1 text-sm sm:text-base text-gray-700">{choice.name}</span>
                            <span className="text-orange-600 font-medium text-sm sm:text-base">+{choice.price.toFixed(2)} kr</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom section with price and add to cart */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 sm:p-6">
          {/* Validation Error Message */}
          {validationError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700 font-medium">{validationError}</span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              Total: <span className="text-orange-600">{total.toFixed(2)} Kr</span>
            </div>
            <button
              disabled={!canAddToCart()}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base ${
                canAddToCart()
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={() => {
                if (validateRequiredFields()) {
                  const selectedExtras = Object.entries(selected).flatMap(([groupId, choiceSet]) =>
                    Array.from(choiceSet).map(choiceId => ({ groupId, choiceId }))
                  );
                  onAddToCart({ selectedExtras, specialRequest, totalPrice: total });
                }
              }}
            >
              Add to Cart · {total.toFixed(2)} kr
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 