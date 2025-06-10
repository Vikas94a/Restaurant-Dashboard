"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { NestedMenuItem, ReusableExtraGroup } from "@/utils/menuTypes";

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
      for (const choiceId of selectedChoices) {
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

  // For accessibility: ARIA labels
  const dialogId = `add-to-cart-dialog-${item.id}`;
  const labelId = `add-to-cart-label-${item.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      ref={dialogRef}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-0 relative overflow-hidden">
        {/* Header with image, name, description */}
        <div className="relative">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-gray-400 text-lg">Image Coming Soon</span>
            </div>
          )}
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute top-3 right-3 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 focus:outline-none"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <h2 id={labelId} className="text-2xl font-bold mb-1">{item.name}</h2>
          {item.description && <p className="text-gray-600 mb-4">{item.description}</p>}

          {/* Special request */}
          <div className="mb-6">
            <label htmlFor="special-request" className="block font-medium text-gray-800 mb-1">
              Special request
            </label>
            <textarea
              id="special-request"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
              rows={2}
              placeholder="e.g., No onions, please"
              value={specialRequest}
              onChange={e => setSpecialRequest(e.target.value)}
            />
          </div>

          {/* Extras section */}
          {extras.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Extras & Add-ons</h3>
              {extras.map(group => (
                <div key={group.id} className="mb-4">
                  <div className="font-medium text-gray-700 mb-1">{group.groupName}</div>
                  <div className="space-y-1">
                    {group.choices.map(choice => (
                      <label key={choice.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type={group.selectionType === "single" ? "radio" : "checkbox"}
                          name={`extra-${group.id}`}
                          checked={!!selected[group.id]?.has(choice.id)}
                          onChange={() => toggleChoice(group, choice.id)}
                          className="accent-primary"
                        />
                        <span className="flex-1">{choice.name}</span>
                        <span className="text-gray-600">+{choice.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Price & Add to Cart */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-lg font-semibold text-gray-900">
              Total: <span className="text-primary">${total.toFixed(2)}</span>
            </div>
            <button
              className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-1 transition-colors text-base"
              onClick={() => {
                const selectedExtras = Object.entries(selected).flatMap(([groupId, choiceSet]) =>
                  Array.from(choiceSet).map(choiceId => ({ groupId, choiceId }))
                );
                onAddToCart({ selectedExtras, specialRequest, totalPrice: total });
              }}
            >
              Add to Cart · ${total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 