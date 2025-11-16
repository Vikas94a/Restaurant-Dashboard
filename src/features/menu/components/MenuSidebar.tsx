/**
 * MenuSidebar - Left navigation pane for categories
 * Foodora-style compact sidebar with active state indicators
 */

"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Category } from '@/utils/menuTypes';

interface MenuSidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

export default function MenuSidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  searchQuery,
  onSearchChange,
  isLoading = false,
}: MenuSidebarProps) {
  return (
    <aside className="w-64 min-w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <FontAwesomeIcon icon={faUtensils} className="w-5 h-5 mr-2 text-orange-600" />
            Kategorier
          </h2>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
          />
          <input
            type="text"
            placeholder="Søk kategorier..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm"
          />
        </div>

        <button
          onClick={onAddCategory}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
          Legg til kategori
        </button>
      </div>

      {/* Category List - Part of unified scroll */}
      <nav className="flex-1">
        {categories.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>Ingen kategorier ennå</p>
            <p className="text-xs mt-1">Klikk "Legg til kategori" for å starte</p>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {categories
              .filter(cat => 
                !searchQuery || 
                cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((category) => {
                const categoryId = category.docId || category.frontendId || '';
                const isSelected = selectedCategoryId === categoryId;
                const itemCount = category.items?.length || 0;

                return (
                  <li key={categoryId}>
                    <button
                      onClick={() => onSelectCategory(categoryId)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 relative ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate flex-1">
                          {category.categoryName || 'Unnamed Category'}
                        </span>
                        {itemCount > 0 && (
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {itemCount}
                          </span>
                        )}
                      </div>
                      {category.categoryDescription && (
                        <p
                          className={`text-xs mt-1 truncate ${
                            isSelected ? 'text-white/80' : 'text-gray-500'
                          }`}
                        >
                          {category.categoryDescription}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </nav>
    </aside>
  );
}

