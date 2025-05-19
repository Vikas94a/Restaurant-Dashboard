import React from 'react';
import { MenuCategoryProps } from '@/types/menu';
import { MenuItem } from './MenuItem';

export const MenuCategory: React.FC<MenuCategoryProps> = ({
  category,                // The menu category object containing name and items
  onEditItem,              // Handler to edit a menu item
  onDeleteItem,            // Handler to delete a menu item
  onToggleItemAvailability,// Handler to toggle availability status of a menu item
}) => {
  return (
    <div className="mb-8">
      {/* Display the category name as a section header */}
      <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
      
      {/* Container for all menu items in this category */}
      <div className="grid gap-4">
        {/* Render each menu item component, passing down necessary props */}
        {category.items.map((item) => (
          <MenuItem
            key={item.id}                 // Unique key for React list rendering
            item={item}                   // The individual menu item data
            onEdit={onEditItem}           // Pass edit handler for this item
            onDelete={onDeleteItem}       // Pass delete handler for this item
            onToggleAvailability={onToggleItemAvailability} // Pass toggle availability handler
          />
        ))}
      </div>
    </div>
  );
};
