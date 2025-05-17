import React from 'react';
import { MenuCategoryProps } from '@/types/menu';
import { MenuItem } from './MenuItem';

export const MenuCategory: React.FC<MenuCategoryProps> = ({
  category,
  onEditItem,
  onDeleteItem,
  onToggleItemAvailability,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
      <div className="grid gap-4">
        {category.items.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
            onToggleAvailability={onToggleItemAvailability}
          />
        ))}
      </div>
    </div>
  );
}; 