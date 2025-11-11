"use client";

import { RefObject } from 'react';

interface Category {
  id: string;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryClick: (categoryName: string) => void;
  categoryTabRef: RefObject<HTMLDivElement | null>;
}

/**
 * CategoryTabs component - Sticky horizontal scrollable category navigation bar
 * Displays category tabs that highlight the active category and scroll into view
 */
export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryClick,
  categoryTabRef,
}: CategoryTabsProps) {
  return (
    <div 
      ref={categoryTabRef}
      className="sticky top-[73px] z-20 bg-white shadow-sm border-b border-orange-100 w-full"
    >
      {/* Mobile: Horizontal scrollable tabs */}
      <div 
        className="lg:hidden overflow-x-auto scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {categories.map((category) => {
            const categoryId = `category-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
            const isActive = activeCategory === category.name;
            return (
              <button
                key={category.id}
                data-category={categoryId}
                onClick={() => onCategoryClick(category.name)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 touch-manipulation whitespace-nowrap active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-md"
                    : "bg-orange-50 text-gray-700 hover:bg-orange-100 active:bg-orange-200 border border-orange-200"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Horizontal scrollable tabs */}
      <div 
        className="hidden lg:block overflow-x-auto scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-3 px-6 py-4 min-w-max max-w-7xl mx-auto">
          {categories.map((category) => {
            const categoryId = `category-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
            const isActive = activeCategory === category.name;
            return (
              <button
                key={category.id}
                data-category={categoryId}
                onClick={() => onCategoryClick(category.name)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-base font-semibold transition-all duration-200 whitespace-nowrap hover:scale-105 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-md"
                    : "bg-orange-50 text-gray-700 hover:bg-orange-100 border border-orange-200"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

