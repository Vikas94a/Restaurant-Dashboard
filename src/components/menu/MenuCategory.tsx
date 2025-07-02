import React from 'react';
import { MenuItem } from './MenuItem';
import { Category, Item } from '@/utils/menuTypes';

interface MenuCategoryProps {
  category: Category;
  items: Item[];
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItem: (categoryId: string) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItemAvailability: (itemId: string) => void;
}

export const MenuCategory: React.FC<MenuCategoryProps> = ({
  category,                // The menu category object containing name and items
  onEditItem,              // Handler to edit a menu item
  onDeleteItem,            // Handler to delete a menu item
  onToggleItemAvailability,// Handler to toggle availability status of a menu item
}) => {
  return (
    <div>
      {/* Display the category name as a section header */}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-5 pb-3 border-b border-gray-200">
        {category.categoryName}
      </h2>

      {/* Container for all menu items in this category */}
      {category.items && category.items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8">
          {/* Render each menu item component, passing down necessary props */}
          {category.items.map((item) => (
            <MenuItem
              key={item.id} // Unique key for React list rendering
              item={item} // The individual menu item data
              onEdit={onEditItem} // Pass edit handler for this item
              onDelete={onDeleteItem} // Pass delete handler for this item
              onToggleAvailability={onToggleItemAvailability} // Pass toggle availability handler
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.001c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700">
            No items in &quot;{category.categoryName}&quot;
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add items to this category to see them here.
          </p>
        </div>
      )}
    </div>
  );
};
