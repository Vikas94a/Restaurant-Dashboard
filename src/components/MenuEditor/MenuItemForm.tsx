import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addMenuItem, updateMenuItem } from '@/store/features/menuSlice';
import { FrontendMenuItem } from '@/services/menuService';

interface MenuItemFormProps {
  restaurantId: string;
  categoryId: string;
  initialData?: FrontendMenuItem;
  onCancel: () => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  restaurantId,
  categoryId,
  initialData,
  onCancel
}) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector(state => state.menu);

  // Form state
  const [formData, setFormData] = useState<Omit<FrontendMenuItem, 'frontendId' | 'categoryId'>>({
    itemName: '',
    itemDescription: '',
    itemPrice: 0,
    ...initialData
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (initialData) {
        await dispatch(updateMenuItem({
          restaurantId,
          categoryId,
          oldMenuItem: {
            itemName: initialData.itemName,
            itemDescription: initialData.itemDescription,
            itemPrice: initialData.itemPrice
          },
          newMenuItem: {
            itemName: formData.itemName,
            itemDescription: formData.itemDescription,
            itemPrice: formData.itemPrice
          }
        })).unwrap();
      } else {
        await dispatch(addMenuItem({
          restaurantId,
          categoryId,
          menuItem: {
            itemName: formData.itemName,
            itemDescription: formData.itemDescription,
            itemPrice: formData.itemPrice
          }
        })).unwrap();
      }
      onCancel();
    } catch (error) {
      // Error is handled by the reducer
      console.error('Failed to save menu item:', error);
    }
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      {/* Name input */}
      <div>
        <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="itemName"
          name="itemName"
          value={formData.itemName}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Description textarea */}
      <div>
        <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="itemDescription"
          name="itemDescription"
          value={formData.itemDescription || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Price number input */}
      <div>
        <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700">
          Price
        </label>
        <input
          type="number"
          id="itemPrice"
          name="itemPrice"
          value={formData.itemPrice}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={status === 'loading'}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {status === 'loading' ? 'Saving...' : initialData ? 'Update' : 'Add'} Item
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm;
