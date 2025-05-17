import React, { useState } from 'react';
import { Category } from '@/services/menuService';

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (updates: Partial<Category>) => void;
  onDelete: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [editedDescription, setEditedDescription] = useState(category.description || '');

  const handleSave = () => {
    onEdit({
      name: editedName,
      description: editedDescription
    });
    setIsEditing(false);
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
                onDelete();
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