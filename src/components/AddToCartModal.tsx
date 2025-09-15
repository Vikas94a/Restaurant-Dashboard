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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
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
  };

  // Validation function
  const validateRequiredExtras = () => {
    const errors: string[] = [];
    
    for (const group of extras) {
      if (group.required && (!selected[group.id] || selected[group.id].size === 0)) {
        errors.push(`Please select at least one option from "${group.groupName}"`);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddToCart = () => {
    if (validateRequiredExtras()) {
      const selectedExtras = Object.entries(selected).flatMap(([groupId, choiceSet]) =>
        Array.from(choiceSet).map(choiceId => ({ groupId, choiceId }))
      );
      onAddToCart({ selectedExtras, specialRequest, totalPrice: total });
    }
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

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2 text-sm">Please complete required selections:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Extras section with proper scrolling */}
          {extras.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Extras & Add-ons</h3>
              <div className="space-y-4 max-h-60 sm:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {extras.map(group => (
                  <div key={group.id} className={`border rounded-lg p-3 ${group.required ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-700 text-sm sm:text-base">{group.groupName}</span>
                      {group.required && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
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
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom section with price and add to cart */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              Total: <span className="text-orange-600">{total.toFixed(2)} Kr</span>
            </div>
            <button
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
              onClick={handleAddToCart}
            >
              Add to Cart · {total.toFixed(2)} kr
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 