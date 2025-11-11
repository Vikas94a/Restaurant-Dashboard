"use client";

import { RefCallback } from 'react';
import { NestedMenuItem } from '@/utils/menuTypes';
import MenuItemCard from './MenuItemCard';

interface MenuCategorySectionProps {
  categoryId: string;
  categoryName: string;
  categoryDescription?: string;
  items: NestedMenuItem[];
  onAddToCart: (item: NestedMenuItem) => void;
  categoryRef: RefCallback<HTMLDivElement> | null;
}

/**
 * MenuCategorySection component - Displays a category with its header and items
 * Includes scroll margin for proper anchor scrolling
 */
export default function MenuCategorySection({
  categoryId,
  categoryName,
  categoryDescription,
  items,
  onAddToCart,
  categoryRef,
}: MenuCategorySectionProps) {
  const categoryElementId = `category-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div
      id={categoryElementId}
      ref={categoryRef}
      className="scroll-mt-[130px] lg:scroll-mt-[140px]"
    >
      {/* Category Header */}
      <div className="mb-4 lg:mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
          {categoryName}
        </h2>
        {categoryDescription && (
          <p className="text-gray-600 text-sm lg:text-base max-w-3xl">
            {categoryDescription}
          </p>
        )}
      </div>

      {/* Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">No items in this category</p>
        </div>
      )}
    </div>
  );
}

