import React from 'react';
import { Button } from "@/components/ui/button";
import CategoryForm from './CategoryForm';
import MenuItemInput from './MenuItemInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEdit, faList, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Item {
  itemName: string;
  itemDescription: string;
  itemPrice: number;
}

interface Category {
  categoryName: string;
  categoryDescription: string;
  items: Item[];
  isEditing?: boolean;
}

interface CategorySectionProps {
  category: Category;
  catIndex: number;
  onCategoryChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onItemChange: (e: React.ChangeEvent<HTMLInputElement>, catIndex: number, itemIndex: number) => void;
  onSubmit: (e: React.FormEvent, catIndex: number) => void;
  onEdit: (catIndex: number) => void;
  onAddItem: () => void;
  isSelected: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  catIndex,
  onCategoryChange,
  onItemChange,
  onSubmit,
  onEdit,
  onAddItem,
  isSelected
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, catIndex);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit(catIndex);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-green-200">
      <div className="p-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <CategoryForm
            categoryName={category.categoryName}
            categoryDescription={category.categoryDescription}
            onCategoryChange={(e) => onCategoryChange(catIndex, e)}
            disabled={!category.isEditing}
          />

          <div className="mt-8">
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faList} className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Menu Items</h3>
              </div>
            </div>

            <div className="space-y-6">
              {category.items.map((item, itemIndex) => (
                <MenuItemInput
                  key={itemIndex}
                  itemName={item.itemName}
                  itemDescription={item.itemDescription}
                  itemPrice={item.itemPrice}
                  onItemChange={(e) => onItemChange(e, catIndex, itemIndex)}
                  disabled={!category.isEditing}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            {category.isEditing && (
              <Button
                type="button"
                onClick={onAddItem}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
              >
                <FontAwesomeIcon icon={faPlus} className="h-5 w-5 mr-2" />
                Add Item
              </Button>
            )}
            <div className="ml-auto">
              {category.isEditing ? (
                <Button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                >
                  <FontAwesomeIcon icon={faCheck} className="h-5 w-5 mr-2" />
                  Save Menu
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleEditClick}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                >
                  <FontAwesomeIcon icon={faEdit} className="h-5 w-5 mr-2" />
                  Edit Menu
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategorySection; 