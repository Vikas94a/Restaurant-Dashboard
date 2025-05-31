import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CategoryFormProps {
  categoryName: string; // Controlled value for the category name input
  categoryDescription: string; // Controlled value for the category description input
  onCategoryChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Handler for input changes
  disabled?: boolean; // Optional flag to disable inputs, default false
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  categoryName,
  categoryDescription,
  onCategoryChange,
  disabled = false
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Category Name Input */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Category Name
        </Label>
        <Input
          name="categoryName"
          value={categoryName}
          onChange={onCategoryChange}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 shadow-sm
            focus:border-green-500 focus:ring-green-500 sm:text-sm
            transition-colors duration-150
            disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="e.g., Appetizers"
        />
      </div>

      {/* Category Description Input */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Category Description
        </Label>
        <Input
          name="categoryDescription"
          value={categoryDescription}
          onChange={onCategoryChange}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 shadow-sm
            focus:border-green-500 focus:ring-green-500 sm:text-sm
            transition-colors duration-150
            disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="A short description of this category"
        />
      </div>
    </div>
  );
};

export default CategoryForm;
