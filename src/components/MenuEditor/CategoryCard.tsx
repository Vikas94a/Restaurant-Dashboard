import React, { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { updateCategory, deleteCategory } from '@/store/features/menuSlice';
import { FrontendCategory } from '@/services/menuService';

interface CategoryCardProps {
  restaurantId: string;
  category: FrontendCategory;
  isSelected: boolean;
  onSelect: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  restaurantId,
  category,
  isSelected,
  onSelect
}) => {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [editedDescription, setEditedDescription] = useState(category.description || '');

  const handleSave = async () => {
    try {
      await dispatch(updateCategory({
        restaurantId,
        categoryId: category.id,
        updates: {
          name: editedName,
          description: editedDescription
        }
      })).unwrap();
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the reducer
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all items in this category.')) {
      try {
        await dispatch(deleteCategory({
          restaurantId,
          categoryId: category.id
        })).unwrap();
      } catch (error) {
        // Error is handled by the reducer
        console.error('Failed to delete category:', error);
      }
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
      }`}
      onClick={!isEditing ? onSelect : undefined}
    >
      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Category name"
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Category description"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold">{category.name}</h3>
          {category.description && (
            <p className="text-gray-600 mt-1">{category.description}</p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryCard;
