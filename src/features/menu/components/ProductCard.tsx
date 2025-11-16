/**
 * ProductCard - Compact product card for admin menu list
 * Shows product info with instant availability toggle
 */

"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faImage, faTag, faStar } from '@fortawesome/free-solid-svg-icons';
import { NestedMenuItem } from '@/utils/menuTypes';
import { AvailabilityState, fromLegacyAvailability } from '../types/availability';
import AvailabilityMenu from './AvailabilityMenu';
import { formatCurrency } from '@/utils/currency';

interface ProductCardProps {
  product: NestedMenuItem;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAvailabilityChange?: (availability: AvailabilityState) => void;
}

export default function ProductCard({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onAvailabilityChange,
}: ProductCardProps) {
  const price = typeof product.price === 'object' ? product.price.amount : product.price || 0;
  
  // Get availability state
  const availability: AvailabilityState = product.availability || fromLegacyAvailability(product.isAvailable ?? true);

  const handleAvailabilityChange = (newAvailability: AvailabilityState) => {
    if (onAvailabilityChange) {
      onAvailabilityChange(newAvailability);
    }
  };

  return (
    <div
      className={`rounded-lg border-2 p-3 md:p-4 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-orange-500 bg-orange-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative w-full h-32 md:h-40 bg-gray-100 rounded-lg overflow-hidden mb-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FontAwesomeIcon icon={faImage} className="w-8 h-8 md:w-12 md:h-12" />
          </div>
        )}
        {product.isPopular && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-10 flex items-center">
            <FontAwesomeIcon icon={faStar} className="w-3 h-3 mr-1" />
            Populær
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center text-base md:text-lg font-bold text-gray-900">
          <FontAwesomeIcon icon={faTag} className="w-3 h-3 md:w-4 md:h-4 text-orange-500 mr-1" />
          {formatCurrency(price)}
        </div>
      </div>

      {/* Availability - Instant Update */}
      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        <AvailabilityMenu
          currentAvailability={availability}
          onAvailabilityChange={handleAvailabilityChange}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
        >
          <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-1" />
          Rediger
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

