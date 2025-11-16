"use client";

import { ReusableExtraGroup } from "@/utils/menuTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";

interface CustomerExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  extras: ReusableExtraGroup[];
  onAddToCart: (selectedExtras: { groupId: string; choiceId: string }[]) => void;
  itemName: string;
}

export default function CustomerExtrasModal({
  isOpen,
  onClose,
  extras,
  onAddToCart,
  itemName,
}: CustomerExtrasModalProps) {
  // Track selected choices as { [groupId]: Set<choiceId> }
  const [selected, setSelected] = useState<{ [groupId: string]: Set<string> }>({});

  useEffect(() => {
    if (!isOpen) {
      setSelected({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleChoice = (groupId: string, choiceId: string) => {
    setSelected(prev => {
      const groupChoices: Set<string> = prev[groupId] ? new Set<string>(prev[groupId]) : new Set<string>();
      if (groupChoices.has(choiceId)) {
        groupChoices.delete(choiceId);
      } else {
        groupChoices.add(choiceId);
      }
      return { ...prev, [groupId]: groupChoices };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-bold mb-4">Add Extras for {itemName}</h2>
        {extras.length === 0 ? (
          <p className="text-gray-600 mb-4">No extras available.</p>
        ) : (
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
            {extras.map((extra) => (
              <div key={extra.id} className="border rounded-lg p-3 mb-2 bg-gray-50">
                <div className="font-semibold text-gray-800 mb-2">{extra.groupName}</div>
                {extra.choices && extra.choices.length > 0 ? (
                  <ul className="space-y-1">
                    {extra.choices.map(choice => (
                      <li key={choice.id} className="flex justify-between items-center text-sm px-2 py-1">
                        <label className="flex items-center gap-2 w-full cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!selected[extra.id]?.has(choice.id)}
                            onChange={() => toggleChoice(extra.id, choice.id)}
                            className="accent-primary"
                          />
                          <span className="flex-1">{choice.name}</span>
                          <span className="text-gray-600">+{choice.price.toFixed(2)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500">No choices available.</div>
                )}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => {
            // Flatten selected choices to [{ groupId, choiceId }]
            const selectedChoices = Object.entries(selected).flatMap(([groupId, choiceSet]) =>
              Array.from(choiceSet).map(choiceId => ({ groupId, choiceId }))
            );
            onAddToCart(selectedChoices);
          }}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
} 