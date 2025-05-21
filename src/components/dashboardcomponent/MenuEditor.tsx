"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase'; // Assuming firebase is configured here
import { collection, getDocs, query, where, addDoc, updateDoc, doc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import ConfirmDialog from '@/components/common/ConfirmDialog';
// Import types based on your Firestore structure as seen in the user's hook and your provided structure
interface NestedMenuItem {
  itemName: string;
  itemDescription?: string;
  itemPrice: number;
}

interface Category {
  docId?: string; // Firestore document ID for the category
  categoryName: string;
  categoryDescription?: string;
  items: (NestedMenuItem & { frontendId?: string })[]; // Add frontendId here as it's used in state, but optional for saving
  isEditing?: boolean; // Client-side flag for editing UI
}

// Frontend representation of a menu item (flattened) - Keep for potential future use or clarity, though not directly used for rendering the nested list now
// interface FrontendMenuItem extends NestedMenuItem {
//   frontendId: string; // Unique ID for frontend rendering (can be generated)
//   categoryId: string; // ID of the parent category
// }

interface MenuEditorProps {
  restaurantId: string;
}

export default function MenuEditor({ restaurantId }: MenuEditorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  // Removed editingItem and editingCategory states as the editing is now handled within the categories array state

  // Fetch menu data from Firestore when restaurantId changes
  useEffect(() => {
    const fetchMenuData = async () => {
      if (!restaurantId) {
        setLoading(false);
        setCategories([]); // Clear categories if no restaurantId
        return; // Exit if no restaurantId provided
      }

      try {
        setLoading(true); // Start loading indicator

        // Reference to the menu subcollection of the given restaurant (assuming 'menu' is where categories are)
        const menuRef = collection(db, "restaurants", restaurantId, "menu");

        // Fetch all documents (categories) under the menu collection
        const querySnapshot = await getDocs(menuRef);

        if (querySnapshot.empty) {
          // If no categories found, initialize with one empty editable category
          setCategories([{
            categoryName: "",
            categoryDescription: "",
            items: [],
            isEditing: true, // Start in editing mode for initial setup
          },]);
        } else {
          // Map over fetched categories to format items and add metadata
          const fetchedCategories = querySnapshot.docs.map((doc) => {
            const data = doc.data();

            // Ensure each item has a unique frontendId, generate if missing
            const itemsWithFrontendIds = data.items?.map((item: NestedMenuItem, index: number) => ({
              ...item,
              frontendId: `${doc.id}-${index}`, // Generate a unique ID for frontend use
            })) || [];

            return {
              ...data,
              docId: doc.id, // store Firestore document id for later updates
              items: itemsWithFrontendIds, // Use items with frontendIds
              isEditing: false, // start with view mode (not editing)
            };
          }) as Category[]; // Cast to Category[] after mapping

          setCategories(fetchedCategories);
        }
      } catch (error) {
        console.error("Error fetching menu data:", error);
        toast.error("Failed to load menu data"); // Notify user of error
        setCategories([]); // Clear categories on error
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };

    fetchMenuData(); // Invoke fetch function when restaurantId changes
  }, [restaurantId]); // Depend on restaurantId

  // Handle changes to category fields (name or description)
  const handleCategoryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedCategories = [...categories];
    updatedCategories[index] = { ...updatedCategories[index], [name]: value };
    setCategories(updatedCategories);
  };

  // Handle changes to item fields (name, description, price) inside a category
  const handleItemChange = (catIndex: number, itemIndex: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedCategories = [...categories];
    const updatedItems = [...updatedCategories[catIndex].items];

    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      [name]: name === "itemPrice" ? parseFloat(value) || 0 : value,
    } as NestedMenuItem & { frontendId?: string }; // Cast with optional frontendId

    updatedCategories[catIndex] = {
      ...updatedCategories[catIndex],
      items: updatedItems,
    };
    setCategories(updatedCategories);
  };

  // Add a new empty category to the list and scroll to bottom for user input
  const handleAddCategory = () => {
    setCategories([{
      categoryName: "",
      categoryDescription: "",
      items: [],
      isEditing: true
    }, ...categories]); // Add to beginning to make it easily visible
    // Optional: scroll to top after adding new category
    // setTimeout(() => {
    //   window.scrollTo({ top: 0, behavior: "smooth" });
    // }, 100);
  };

  // Add a new empty item inside a specific category
  const handleAddItem = (catIndex: number) => {
    const updatedCategories = [...categories];
    // Generate a temporary frontend ID for the new item
    const frontendId = `${updatedCategories[catIndex].docId || 'new'}-${updatedCategories[catIndex].items.length}-${Date.now()}`;
    updatedCategories[catIndex].items.push({
      // No doc ID here as it's nested
      itemName: "",
      itemDescription: "",
      itemPrice: 0,
      frontendId: frontendId, // Add frontend ID for rendering
    });

    setCategories(updatedCategories);
  };

  // Toggle editing mode for a category
  const toggleEditCategory = (index: number, isEditing: boolean) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = { ...updatedCategories[index], isEditing: isEditing };
    setCategories(updatedCategories);
  };

  // Handle saving category and its items to Firestore
  const handleSaveCategory = async (catIndex: number) => {
    if (!restaurantId) {
      toast.error("Restaurant ID not found. Cannot save menu.");
      return;
    }

    try {
      setLoading(true); // Indicate saving is in progress

      const cat = categories[catIndex];

      // Basic validation
      if (!cat.categoryName.trim()) {
        toast.error("Category name cannot be empty.");
        setLoading(false);
        return;
      }

      // Validate and prepare items for saving (remove frontendId)
      const validItems = cat.items.map(item => {
          // Ensure itemPrice is a number
          const itemPrice = typeof item.itemPrice === 'number' ? item.itemPrice : parseFloat(item.itemPrice as any) || 0;
           // Remove frontendId before saving to Firestore
          const { frontendId, ...nestedItemData } = item as any; // Cast to any to easily remove frontendId
          return { ...nestedItemData, itemPrice };
      });

      if (cat.docId) {
        // Update existing category document
        const categoryDocRef = doc(db, "restaurants", restaurantId!, "menu", cat.docId!);
        await updateDoc(categoryDocRef, {
          categoryName: cat.categoryName.trim(),
          categoryDescription: cat.categoryDescription?.trim() || "",
          items: validItems, // Save the updated items array
        });
        toast.success("Category updated successfully!");
      } else {
        // Add new category document
        // Optional: Check for duplicate category names before adding
        const q = query(
            collection(db, "restaurants", restaurantId!, "menu"),
            where("categoryName", "==", cat.categoryName.trim())
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              toast.error(`Category "${cat.categoryName.trim()}" already exists.`);
              setLoading(false);
              return;
          }

        const menuRef = collection(db, "restaurants", restaurantId!, "menu");
        const docRef = await addDoc(menuRef, {
          categoryName: cat.categoryName.trim(),
          categoryDescription: cat.categoryDescription?.trim() || "",
          items: validItems, // Save the items array
        });

        // Update the local state with the new docId
        const updatedCategories = [...categories];
        updatedCategories[catIndex] = { ...updatedCategories[catIndex], docId: docRef.id };
        setCategories(updatedCategories);

        toast.success("New category added successfully!");
      }

      // Exit editing mode after successful save
      toggleEditCategory(catIndex, false);

    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a category document from Firestore
  const handleDeleteCategory = async (catIndex: number) => {
    if (!restaurantId) {
      toast.error("Restaurant ID not found. Cannot delete category.");
      return;
    }

    const categoryToDelete = categories[catIndex];
    if (!categoryToDelete.docId) {
      toast.error("Category has not been saved yet.");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete the category "${categoryToDelete.categoryName}"? This will also delete all items within it.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          const categoryDocRef = doc(db, "restaurants", restaurantId!, "menu", categoryToDelete.docId!);
          await deleteDoc(categoryDocRef);

          // Remove the category from local state
          setCategories(categories.filter((_, index) => index !== catIndex));

          toast.success("Category deleted successfully!");
        } catch (error) {
          console.error("Error deleting category:", error);
          toast.error("Failed to delete category.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Handle deleting a nested menu item
  const handleDeleteItem = async (catIndex: number, itemIndex: number) => {
    if (!restaurantId || !categories[catIndex].docId) {
      toast.error("Cannot delete item: Category not saved or restaurant ID missing.");
      return;
    }

    const updatedCategories = [...categories];
    const categoryToUpdate = { ...updatedCategories[catIndex] };
    const itemToDelete = categoryToUpdate.items[itemIndex];

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete the item "${itemToDelete.itemName}"?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          const categoryDocRef = doc(db, "restaurants", restaurantId!, "menu", categoryToUpdate.docId!);
          // Remove the item from the array in Firestore
          await updateDoc(categoryDocRef, {
            items: categoryToUpdate.items.filter((_, index) => index !== itemIndex) // Filter out the item to delete
          });

          // Update local state by removing the item
          categoryToUpdate.items.splice(itemIndex, 1);
          updatedCategories[catIndex] = categoryToUpdate;
          setCategories(updatedCategories);

          toast.success("Item deleted successfully!");
        } catch (error) {
          console.error("Error deleting item:", error);
          toast.error("Failed to delete item.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
    <ConfirmDialog
      isOpen={confirmDialog.isOpen}
      onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      onConfirm={confirmDialog.onConfirm}
      title={confirmDialog.title}
      message={confirmDialog.message}
    />
  
    {loading && <div className="text-center text-gray-600">Loading menu data...</div>}
  
    {!loading && categories.length === 0 && (
      <div className="text-center text-gray-500">
        <p>No menu data found. Add your first category to get started!</p>
        <button
          onClick={handleAddCategory}
          className="mt-4 btn btn-primary"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add First Category
        </button>
      </div>
    )}
  
    {!loading && categories.length > 0 && (
      <>
        {/* Categories Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Menu Categories</h2>
            <button
              onClick={handleAddCategory}
              className="btn btn-primary"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Category
            </button>
          </div>
  
          <div className="grid gap-6">
            {categories.map((category, catIndex) => (
              <div key={category.docId || `new-category-${catIndex}`} className="bg-white rounded-xl shadow-sm overflow-hidden transition hover:shadow-md">
                {/* Category Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-start gap-4">
                  {category.isEditing ? (
                    <div className="flex-grow">
                      <input
                        type="text"
                        name="categoryName"
                        value={category.categoryName}
                        onChange={(e) => handleCategoryChange(catIndex, e)}
                        className="input input-bordered w-full text-lg font-semibold mb-2"
                        placeholder="Category Name"
                        required
                      />
                      <textarea
                        name="categoryDescription"
                        value={category.categoryDescription || ''}
                        onChange={(e) => handleCategoryChange(catIndex, e)}
                        className="textarea textarea-bordered w-full text-sm"
                        placeholder="Category Description (optional)"
                      />
                    </div>
                  ) : (
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900">{category.categoryName || 'Unnamed Category'}</h3>
                      {category.categoryDescription && <p className="text-sm text-gray-500 mt-1">{category.categoryDescription}</p>}
                    </div>
                  )}
  
                  {/* Category Actions */}
                  <div className="flex items-center gap-2">
                    {category.isEditing ? (
                      <button
                        onClick={() => handleSaveCategory(catIndex)}
                        className="btn btn-sm btn-success"
                        disabled={loading}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleEditCategory(catIndex, true)}
                        className="btn btn-sm btn-ghost"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCategory(catIndex)}
                      className="btn btn-sm btn-ghost text-red-500 hover:bg-red-100"
                      disabled={loading || !category.docId}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
  
                {/* Items within the Category */}
                <div className="p-4 space-y-4">
                  <h4 className="text-lg font-medium text-gray-700">Items</h4>
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={item.frontendId || `new-item-${catIndex}-${itemIndex}`} className="bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-center">
                        {category.isEditing ? (
                          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Item Name</label>
                              <input
                                type="text"
                                name="itemName"
                                value={item.itemName}
                                onChange={(e) => handleItemChange(catIndex, itemIndex, e)}
                                className="mt-1 input input-bordered w-full"
                                placeholder="Name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Description</label>
                              <textarea
                                name="itemDescription"
                                value={item.itemDescription || ''}
                                onChange={(e) => handleItemChange(catIndex, itemIndex, e)}
                                className="mt-1 textarea textarea-bordered w-full text-sm"
                                placeholder="Description (optional)"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Price</label>
                              <input
                                type="number"
                                name="itemPrice"
                                value={item.itemPrice}
                                onChange={(e) => handleItemChange(catIndex, itemIndex, e)}
                                className="mt-1 input input-bordered w-full"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex-grow mr-4">
                            <h5 className="font-medium text-gray-800">{item.itemName || 'Unnamed Item'}</h5>
                            {item.itemDescription && <p className="text-gray-600 text-sm">{item.itemDescription}</p>}
                            <p className="text-primary font-semibold mt-1">${item.itemPrice.toFixed(2)}</p>
                          </div>
                        )}
  
                        {/* Item Actions (only in edit mode) */}
                        {category.isEditing && (
                          <button
                            onClick={() => handleDeleteItem(catIndex, itemIndex)}
                            className="btn btn-ghost btn-sm text-red-500 flex-shrink-0 ml-2"
                            disabled={loading}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    ))}
  
                    {category.items.length === 0 && !category.isEditing && (
                      <p className="text-gray-400 italic">No items added yet.</p>
                    )}
                  </div>
  
                  {category.isEditing && (
                    <button
                      onClick={() => handleAddItem(catIndex)}
                      className="btn btn-outline btn-sm mt-3"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Item
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    )}
  </div>
  
  );
} 