import React, { useState, useEffect } from 'react';
import { menuService, MenuItem, Category } from '@/services/menuService';
import CategoryCard from './CategoryCard';
import MenuItemForm from './MenuItemForm';

interface MenuEditorProps {
  restaurantId: string;
}

const MenuEditor: React.FC<MenuEditorProps> = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    loadMenuData();
  }, [restaurantId]);

  const loadMenuData = async () => {
    try {
      const [items, cats] = await Promise.all([
        menuService.getMenuItems(restaurantId),
        menuService.getCategories(restaurantId)
      ]);
      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading menu data:', error);
    }
  };

  const handleAddItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const newItemId = await menuService.addMenuItem(restaurantId, item);
      const newItem = { ...item, id: newItemId };
      setMenuItems([...menuItems, newItem]);
      setIsAddingItem(false);
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      await menuService.updateMenuItem(restaurantId, itemId, updates);
      setMenuItems(menuItems.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await menuService.deleteMenuItem(restaurantId, itemId);
      setMenuItems(menuItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const handleAddCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategoryId = await menuService.addCategory(restaurantId, category);
      const newCategory = { ...category, id: newCategoryId };
      setCategories([...categories, newCategory]);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category === selectedCategory)
    : menuItems;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Editor</h2>
        <button
          onClick={() => setIsAddingItem(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Menu Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {categories.map(category => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            onSelect={() => setSelectedCategory(category.id || null)}
            onEdit={(updates) => handleUpdateItem(category.id!, updates)}
            onDelete={() => handleDeleteItem(category.id!)}
          />
        ))}
      </div>

      {isAddingItem && (
        <MenuItemForm
          categories={categories}
          onSubmit={handleAddItem}
          onCancel={() => setIsAddingItem(false)}
        />
      )}

      {editingItem && (
        <MenuItemForm
          categories={categories}
          initialData={editingItem}
          onSubmit={(updates) => handleUpdateItem(editingItem.id!, updates)}
          onCancel={() => setEditingItem(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-gray-600">{item.description}</p>
            <p className="text-lg font-bold">${item.price.toFixed(2)}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setEditingItem(item)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteItem(item.id!)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuEditor; 