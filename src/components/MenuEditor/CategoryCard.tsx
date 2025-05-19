import React, { useState } from 'react';
import { Category } from '@/services/menuService';

interface CategoryCardProps {
  category: Category;             // Category object with id, name, description, etc.
  isSelected: boolean;            // Whether this card is currently selected (for UI highlight)
  onSelect: () => void;           // Callback when the card is clicked (to select it)
  onEdit: (updates: Partial<Category>) => void;   // Callback to update category data
  onDelete: () => void;           // Callback to delete this category
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  // Local state for whether card is in edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Local state to track edited values while in edit mode
  const [editedName, setEditedName] = useState(category.name);
  const [editedDescription, setEditedDescription] = useState(category.description || '');

  // Handler to save changes: calls onEdit with updates and exits edit mode
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
      // Only trigger onSelect when NOT editing, to avoid accidental select while editing
      onClick={!isEditing ? onSelect : undefined}
    >
      {isEditing ? (
        // Edit mode UI: inputs for name and description + Save/Cancel buttons
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
        // View mode UI: show category name, description, and action buttons
        <>
          <h3 className="text-lg font-semibold">{category.name}</h3>
          {category.description && (
            <p className="text-gray-600 mt-1">{category.description}</p>
          )}
          <div className="mt-2 flex gap-2">
            {/* Edit button sets editing mode, stopping event from bubbling to prevent onSelect */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              Edit
            </button>
            {/* Delete button triggers onDelete callback, also stops event propagation */}
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
