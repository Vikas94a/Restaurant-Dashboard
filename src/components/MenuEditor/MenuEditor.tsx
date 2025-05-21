import React, { useState, useEffect } from "react";
import { menuService, MenuItem, Category } from "@/services/menuService";
import CategoryCard from "./CategoryCard";
import MenuItemForm from "./MenuItemForm";

interface MenuEditorProps {
  restaurantId: string;
}

const MenuEditor: React.FC<MenuEditorProps> = ({ restaurantId }) => {
  // State to store all menu items (dishes)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  // State to store all categories (menu sections)
  const [categories, setCategories] = useState<Category[]>([]);
  // Currently selected category ID for filtering menu items
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Whether the "Add Menu Item" form is open
  const [isAddingItem, setIsAddingItem] = useState(false);
  // The menu item currently being edited (null if none)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Function to load both menu items and categories concurrently
  const loadMenuData = async () => {
    try {
      // Fetch menu items and categories simultaneously
      const [items, cats] = await Promise.all([
        menuService.getMenuItems(restaurantId),
        menuService.getCategories(restaurantId),
      ]);
      setMenuItems(items); // Save items to state
      setCategories(cats); // Save categories to state
    } catch (error) {
      console.error("Error loading menu data:", error);
    }
  };

  // Load menu data from backend whenever restaurantId changes
  useEffect(() => {
    loadMenuData();
  }, [restaurantId]);

  // Handler to add a new menu item
  const handleAddItem = async (item: Omit<MenuItem, "id">) => {
    try {
      // Send the new item to backend and get generated id
      const newItemId = await menuService.addMenuItem(restaurantId, item);
      // Create new item object with returned id
      const newItem = { ...item, id: newItemId };
      // Add new item to current menuItems state
      setMenuItems([...menuItems, newItem]);
      // Close the add item form
      setIsAddingItem(false);
    } catch (error) {
      console.error("Error adding menu item:", error);
    }
  };

  // Handler to update an existing menu item
  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<MenuItem>
  ) => {
    try {
      // Send updated fields to backend
      await menuService.updateMenuItem(restaurantId, itemId, updates);
      // Update item in local state to reflect changes immediately
      setMenuItems(
        menuItems.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
      // Clear editing state (close edit form)
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating menu item:", error);
    }
  };

  // Handler to delete a menu item
  const handleDeleteItem = async (itemId: string) => {
    try {
      // Ask backend to delete item by id
      await menuService.deleteMenuItem(restaurantId, itemId);
      // Remove deleted item from local state to update UI
      setMenuItems(menuItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting menu item:", error);
    }
  };

  // Handler to add a new category (menu section)
  const handleAddCategory = async (category: Omit<Category, "id">) => {
    try {
      // Send new category to backend and get generated id
      const newCategoryId = await menuService.addCategory(
        restaurantId,
        category
      );
      // Create new category object with id
      const newCategory = { ...category, id: newCategoryId };
      // Add to categories state to update UI
      setCategories([...categories, newCategory]);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  // Filter menu items by selected category, or show all if none selected
  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : menuItems;

  console.log("Its a menuitems in the console window", menuItems);
  return (
    <div className="p-4">
  
      {/* Header with title and button to open add item form */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Editor</h2>
        <button
          onClick={() => setIsAddingItem(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Menu Item
        </button>
      </div>

      {/* Display categories as selectable cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            // When category is clicked, set it as selected or deselect if same
            onSelect={() => setSelectedCategory(category.id || null)}
            // TODO: These handlers need to be fixed as explained previously
            onEdit={(updates) => handleUpdateItem(category.id!, updates)}
            onDelete={() => handleDeleteItem(category.id!)}
          />
        ))}
      </div>

      {/* Show add menu item form when adding */}
      {isAddingItem && (
        <MenuItemForm
          categories={categories}
          onSubmit={handleAddItem}
          onCancel={() => setIsAddingItem(false)}
        />
      )}

      {/* Show edit menu item form when editing */}
      {editingItem && (
        <MenuItemForm
          categories={categories}
          initialData={editingItem}
          onSubmit={(updates) => handleUpdateItem(editingItem.id!, updates)}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {/* Show list of menu items filtered by selected category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-gray-600">{item.description}</p>
            <p className="text-lg font-bold">${(item.price || 0).toFixed(2)}</p>
            <div className="mt-2 flex gap-2">
              {/* Button to edit the item: opens editing form */}
              <button
                onClick={() => setEditingItem(item)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
              {/* Button to delete the item */}
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
