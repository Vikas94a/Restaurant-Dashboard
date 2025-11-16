/**
 * EditProductModal - Right slide-in modal for editing product details
 * Foodora-style compact modal that doesn't cover the entire screen
 */

"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faCheck } from '@fortawesome/free-solid-svg-icons';
import { NestedMenuItem, ReusableExtraGroup } from '@/utils/menuTypes';
import { AvailabilityState, fromLegacyAvailability } from '../types/availability';
import AvailabilityMenu from './AvailabilityMenu';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: NestedMenuItem | null;
  reusableExtras: ReusableExtraGroup[];
  onSave: (productId: string, updates: Partial<NestedMenuItem>) => Promise<void>;
  onAvailabilityChange?: (productId: string, availability: AvailabilityState) => void;
}

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  reusableExtras,
  onSave,
  onAvailabilityChange,
}: EditProductModalProps) {
  const [formData, setFormData] = useState<Partial<NestedMenuItem>>({});
  const [selectedLinkedExtraIds, setSelectedLinkedExtraIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      const price = typeof product.price === 'object' ? product.price.amount : product.price || 0;
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: {
          amount: price,
          currency: product.price?.currency || 'NOK',
        },
        imageUrl: product.imageUrl || '',
        isPopular: product.isPopular || false,
        dietaryTags: product.dietaryTags || [],
        linkedReusableExtraIds: product.linkedReusableExtraIds || [],
      });
      setSelectedLinkedExtraIds(product.linkedReusableExtraIds || []);
      setHasChanges(false);
    }
  }, [product, isOpen]);

  // Check for changes
  useEffect(() => {
    if (!product) {
      setHasChanges(false);
      return;
    }

    const price = typeof product.price === 'object' ? product.price.amount : product.price || 0;
    const hasNameChange = formData.name !== product.name;
    const hasDescChange = formData.description !== product.description;
    const hasPriceChange = formData.price?.amount !== price;
    const hasImageChange = formData.imageUrl !== (product.imageUrl || '');
    const hasPopularChange = formData.isPopular !== (product.isPopular || false);
    const hasTagsChange = JSON.stringify(formData.dietaryTags || []) !== JSON.stringify(product.dietaryTags || []);
    const hasLinkedChange = JSON.stringify(selectedLinkedExtraIds.sort()) !== JSON.stringify((product.linkedReusableExtraIds || []).sort());

    setHasChanges(hasNameChange || hasDescChange || hasPriceChange || hasImageChange || hasPopularChange || hasTagsChange || hasLinkedChange);
  }, [formData, selectedLinkedExtraIds, product]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleChange = (field: keyof NestedMenuItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!product || !hasChanges) return;

    const productId = product.id || product.frontendId || '';
    if (!productId) {
      toast.error('Kunne ikke finne produkt-ID');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<NestedMenuItem> = {
        ...formData,
        linkedReusableExtraIds: selectedLinkedExtraIds,
      };
      await onSave(productId, updates);
      toast.success('Produkt oppdatert');
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Kunne ikke lagre produkt');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLinkedExtra = (groupId: string) => {
    setSelectedLinkedExtraIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (!isOpen || !product) return null;

  const availability: AvailabilityState = product.availability || fromLegacyAvailability(product.isAvailable ?? true);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal - Slides in from right, half-width on desktop */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[90%] md:w-[70%] lg:w-[50%] xl:w-[42rem] max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <h2 className="text-xl font-bold text-gray-900">Rediger produkt</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
            aria-label="Lukk"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produktnavn *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="F.eks. Margherita Pizza"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beskrivelse
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              placeholder="Beskriv produktet..."
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pris (NOK) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              step="0.01"
              min="0"
              value={formData.price?.amount || 0}
              onChange={(e) =>
                handleChange('price', {
                  ...formData.price,
                  amount: parseFloat(e.target.value) || 0,
                  currency: 'NOK',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bilde-URL
            </label>
            <input
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tilgjengelighet
            </label>
            <AvailabilityMenu
              currentAvailability={availability}
              onAvailabilityChange={(newAvailability) => {
                if (onAvailabilityChange) {
                  const productId = product.id || product.frontendId || '';
                  onAvailabilityChange(productId, newAvailability);
                }
              }}
            />
          </div>

          {/* Popular Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Populær rett
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Vis "Populær" merke på kundemenyen
              </p>
            </div>
            <button
              onClick={() => handleChange('isPopular', !formData.isPopular)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isPopular ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isPopular ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Linked Option Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tilknyttede alternativgrupper
            </label>
            {reusableExtras.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                Ingen alternativgrupper tilgjengelig. Opprett grupper i hovedmenyen.
              </p>
            ) : (
              <div className="space-y-2">
                {reusableExtras.map((group) => {
                  const isSelected = selectedLinkedExtraIds.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleLinkedExtra(group.id)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLinkedExtra(group.id)}
                              className="mr-3 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="font-medium text-gray-900">
                              {group.groupName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-7">
                            {group.choices.length} alternativer
                            {group.required && ' • Påkrevd'}
                          </p>
                        </div>
                        {isSelected && (
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="w-5 h-5 text-orange-600"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 md:p-6 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Lagrer...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
                Lagre endringer
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

