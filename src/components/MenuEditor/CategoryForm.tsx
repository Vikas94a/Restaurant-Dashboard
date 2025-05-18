import React from 'react';
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";

interface CategoryFormProps {
  categoryName: string;
  categoryDescription: string;
  onCategoryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  categoryName,
  categoryDescription,
  onCategoryChange,
  disabled = false
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Category Name
        </Label>
        <Input
          name="categoryName"
          value={categoryName}
          onChange={onCategoryChange}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="e.g., Appetizers"
        />
      </div>
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Category Description
        </Label>
        <Input
          name="categoryDescription"
          value={categoryDescription}
          onChange={onCategoryChange}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="A short description of this category"
        />
      </div>
    </div>
  );
};

export default CategoryForm; 