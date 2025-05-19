import React from 'react';
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";

interface MenuItemInputProps {
  itemName: string;
  itemDescription: string;
  itemPrice: number;
  onItemChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; // Optional prop to disable inputs, default is false
}

const MenuItemInput: React.FC<MenuItemInputProps> = ({
  itemName,
  itemDescription,
  itemPrice,
  onItemChange,
  disabled = false // default value for disabled prop
}) => {
  return (
    // Container div with styling for background, border, padding, and hover effects
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-100 hover:border-green-300 hover:bg-green-50/30 transition-all duration-300 shadow-sm hover:shadow-md">
      
      {/* Grid layout for name and price inputs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        
        {/* Item Name input occupies 2 columns on medium+ screens */}
        <div className="col-span-2">
          {/* Accessible label for item name */}
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </Label>
          {/* Controlled input for item name */}
          <Input
            name="itemName" // Name attribute used to identify input in onChange handler
            value={itemName} // Controlled value from props
            onChange={onItemChange} // Calls parent handler on change
            disabled={disabled} // Disables input if true
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., Caesar Salad"
          />
        </div>
        
        {/* Price input occupies 1 column on medium+ screens */}
        <div>
          {/* Accessible label for price */}
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </Label>
          {/* Controlled input for price */}
          <Input
            name="itemPrice"
            type="number" // Numeric input for price
            value={itemPrice}
            onChange={onItemChange}
            disabled={disabled}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0.00"
            min="0" // Minimum value 0 to avoid negative prices
            step="0.01" // Allows decimals up to two places
          />
        </div>
      </div>
      
      {/* Full-width input for item description below the grid */}
      <div className="mt-4">
        {/* Accessible label for description */}
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Item Description
        </Label>
        {/* Controlled input for description */}
        <Input
          name="itemDescription"
          value={itemDescription}
          onChange={onItemChange}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="A brief description of the item"
        />
      </div>
    </div>
  );
};

export default MenuItemInput;
