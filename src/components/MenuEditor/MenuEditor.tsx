import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMenuData, deleteMenuItem } from '@/store/features/menuSlice';
import CategoryCard from './CategoryCard';
import MenuItemForm from './MenuItemForm';
import { FrontendCategory, FrontendMenuItem } from '@/services/menuService';
import { toast } from 'sonner';

interface MenuEditorProps {
  restaurantId: string;
}

const MenuEditor: React.FC<MenuEditorProps> = ({ restaurantId }) => {
  const dispatch = useAppDispatch();
  const { categories, items, status, error } = useAppSelector(state => state.menu);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<FrontendMenuItem | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Fetch menu data when component mounts
  useEffect(() => {
    dispatch(fetchMenuData(restaurantId));
  }, [dispatch, restaurantId]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsAddingItem(false);
    setEditingItem(null);
  };

  // Get selected category
  const selectedCategory = selectedCategoryId
    ? categories.find((cat: FrontendCategory) => cat.id === selectedCategoryId)
    : null;

  // Get items for selected category
  const categoryItems = selectedCategoryId
    ? items.filter((item: FrontendMenuItem) => item.categoryId === selectedCategoryId)
    : [];

  // Handle item edit
  const handleEditItem = (item: FrontendMenuItem) => {
    setEditingItem(item);
    setIsAddingItem(false);
  };

  // Handle item delete
  const handleDeleteItem = async (item: FrontendMenuItem) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await dispatch(deleteMenuItem({
          restaurantId,
          categoryId: selectedCategoryId!,
          menuItem: {
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            itemPrice: item.itemPrice
          }
        })).unwrap();
        toast.success('Item deleted successfully');
      } catch (error) {
        // Error is handled by the reducer
        console.error('Failed to delete item:', error);
      }
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (status === 'failed') {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading menu: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Categories Section */}
      <div className="md:col-span-1 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <div className="space-y-2">
          {categories.map((category: FrontendCategory) => (
            <CategoryCard
              key={category.id}
              restaurantId={restaurantId}
              category={category}
              isSelected={category.id === selectedCategoryId}
              onSelect={() => handleCategorySelect(category.id)}
              isEditing={editingCategoryId === category.id}
              onEdit={() => setEditingCategoryId(category.id)}
              onEditCancel={() => setEditingCategoryId(null)}
            />
          ))}
        </div>
      </div>

      {/* Items Section */}
      <div className="md:col-span-2">
        {selectedCategory ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selectedCategory.name} Items
              </h2>
              <button
                onClick={() => {
                  setIsAddingItem(true);
                  setEditingItem(null);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Item
              </button>
            </div>

            {/* Add/Edit Item Form */}
            {(isAddingItem || editingItem) && (
              <MenuItemForm
                restaurantId={restaurantId}
                categoryId={selectedCategoryId!}
                initialData={editingItem || undefined}
                onCancel={() => {
                  setIsAddingItem(false);
                  setEditingItem(null);
                }}
              />
            )}

            {/* Items List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryItems.map((item: FrontendMenuItem) => (
                <div
                  key={item.frontendId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{item.itemName}</h3>
                      <p className="text-gray-600 mt-1">{item.itemDescription}</p>
                      <p className="text-blue-600 font-semibold mt-2">
                        ${item.itemPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            Select a category to view or edit its items
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuEditor; 