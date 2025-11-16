/**
 * CategoryList - Middle pane showing products in selected category
 * Foodora-style product grid with compact cards
 */

"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faUtensils } from '@fortawesome/free-solid-svg-icons';
import { Category, NestedMenuItem } from '@/utils/menuTypes';
import ProductCard from './ProductCard';
import { AvailabilityState } from '../types/availability';

interface CategoryListProps {
  category: Category | null;
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  onAddProduct: () => void;
  onProductChange: (productId: string, field: string, value: any) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleAvailability?: (productId: string) => void;
  onAvailabilityChange?: (productId: string, availability: AvailabilityState) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

export default function CategoryList({
  category,
  selectedProductId,
  onSelectProduct,
  onAddProduct,
  onProductChange,
  onDeleteProduct,
  onToggleAvailability,
  onAvailabilityChange,
  searchQuery,
  onSearchChange,
  isLoading = false,
}: CategoryListProps) {
  if (!category) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <FontAwesomeIcon icon={faUtensils} className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Velg en kategori for å se produkter</p>
        </div>
      </div>
    );
  }

  const filteredProducts = (category.items || []).filter((product) =>
    !searchQuery ||
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {category.categoryName || 'Unnamed Category'}
            </h2>
            {category.categoryDescription && (
              <p className="text-sm text-gray-600 mt-1">
                {category.categoryDescription}
              </p>
            )}
          </div>
          <button
            onClick={onAddProduct}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
            Legg til produkt
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
          />
          <input
            type="text"
            placeholder="Søk produkter..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Product List - Part of unified scroll */}
      <div className="p-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faPlus} className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? 'Ingen produkter funnet' : 'Ingen produkter ennå'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? 'Prøv å justere søkeordene'
                : 'Klikk "Legg til produkt" for å opprette ditt første produkt'}
            </p>
            {!searchQuery && (
              <button
                onClick={onAddProduct}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
              >
                Legg til produkt
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id || product.frontendId}
                product={product}
                isSelected={selectedProductId === (product.id || product.frontendId)}
                onSelect={() => onSelectProduct(product.id || product.frontendId || '')}
                onEdit={() => onSelectProduct(product.id || product.frontendId || '')}
                onDelete={() => onDeleteProduct(product.id || product.frontendId || '')}
                onAvailabilityChange={onAvailabilityChange ? (availability) => {
                  const productId = product.id || product.frontendId || '';
                  onAvailabilityChange(productId, availability);
                } : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

