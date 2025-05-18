import React from 'react';
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";

interface MenuItemInputProps {
  itemName: string;
  itemDescription: string;
  itemPrice: number;
  onItemChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const MenuItemInput: React.FC<MenuItemInputProps> = ({
  itemName,
  itemDescription,
  itemPrice,
  onItemChange,
  disabled = false
}) => {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-100 hover:border-green-300 hover:bg-green-50/30 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </Label>
          <Input
            name="itemName"
            value={itemName}
            onChange={onItemChange}
            disabled={disabled}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., Caesar Salad"
          />
        </div>
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </Label>
          <Input
            name="itemPrice"
            type="number"
            value={itemPrice}
            onChange={onItemChange}
            disabled={disabled}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="mt-4">
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Item Description
        </Label>
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