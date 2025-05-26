"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { toast } from 'sonner';

// Types
export interface NestedMenuItem {
  id?: string;
  frontendId?: string;
  // Support both old and new formats
  name?: string;
  itemName?: string;
  description?: string;
  itemDescription?: string;
  price?: { amount: number; currency: string };
  itemPrice?: number;
  imageUrl?: string;
  itemImage?: string | null;
  category?: string;
  isAvailable?: boolean;
  isPopular?: boolean;
  dietaryTags?: string[];
  customizations?: CustomizationGroup[];
  linkedReusableExtras?: { [groupId: string]: string[] };
  linkedReusableExtraIds?: string[];
  subItems?: NestedMenuItem[];
  itemType?: 'item' | 'modifier';
  isEditing?: boolean;
}

export interface CustomizationChoice {
  id: string; // Can be a generated unique ID
  name: string;
  price: number; // Additional price, can be 0
  isDefault?: boolean;
  isEditing?: boolean;
}

export interface CustomizationGroup {
  id: string; // Can be a generated unique ID
  groupName: string; // e.g., "Drinks", "Sauces", "Spice Level"
  selectionType: 'single' | 'multiple'; // Radio buttons or checkboxes
  required?: boolean;
  choices: CustomizationChoice[];
}

export interface Category {
  docId?: string;
  categoryName: string;
  categoryDescription?: string;
  items: NestedMenuItem[];
  frontendId?: string;
  isEditing?: boolean;
}

// New interfaces for the Reusable Extras Library
export interface ReusableExtraChoice {
  id: string; 
  name: string;
  price: number; 
}

export interface ReusableExtraGroup {
  id: string; // Firestore document ID for this group
  groupName: string; 
  selectionType: 'single' | 'multiple'; 
  choices: ReusableExtraChoice[];
  // Potentially: isArchived?: boolean; // To hide without deleting
}

export type ItemChangeField = 
  | 'name' 
  | 'description' 
  | 'priceAmount' 
  | 'priceCurrency' 
  | 'isAvailable' 
  | 'isPopular' 
  | 'dietaryTags' 
  | 'itemType';

export function useMenuEditor(restaurantId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [reusableExtras, setReusableExtras] = useState<ReusableExtraGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExtras, setLoadingExtras] = useState(true); // Separate loading for extras
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

  // Fetch menu data from Firestore
  const fetchMenuData = async () => {
    if (!restaurantId) {
      setLoading(false);
      setCategories([]);
      return;
    }

    try {
      setLoading(true);

      const menuRef = collection(db, "restaurants", restaurantId, "menu");
      const querySnapshot = await getDocs(menuRef);

      if (querySnapshot.empty) {
        setCategories([{
          categoryName: "",
          categoryDescription: "",
          items: [],
          isEditing: true,
        }]);
      } else {
        const fetchedCategories = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          const itemsWithFrontendIds = data.items?.map((item: NestedMenuItem, index: number) => ({
            ...item,
            frontendId: `${doc.id}-${index}`,
          })) || [];

          return {
            ...data,
            docId: doc.id,
            items: itemsWithFrontendIds,
            isEditing: false,
          };
        }) as Category[];

        setCategories(fetchedCategories);
      }
    } catch (error) {
      console.error("Error fetching menu data:", error);
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
    fetchReusableExtras(); // Fetch extras when restaurantId changes
  }, [restaurantId]);

  // Handle changes to category fields
  const handleCategoryChange = (
    catIndex: number, 
    field: keyof Pick<Category, 'categoryName' | 'categoryDescription'>, 
    value: string
  ) => {
    setCategories(prevCategories => {
      const newCategories = [...prevCategories];
      if (catIndex >= 0 && catIndex < newCategories.length) {
        newCategories[catIndex] = {
          ...newCategories[catIndex],
          [field]: value
        };
      }
      return newCategories;
    });
  };

  // Handle changes to item fields within a category
  const handleItemChange = (
    catIndex: number, 
    itemIndex: number, 
    field: ItemChangeField,
    value: string | number | boolean | string[]
  ) => {
    const newCategories = [...categories];
    if (catIndex >= 0 && catIndex < newCategories.length && 
        itemIndex >= 0 && itemIndex < newCategories[catIndex].items.length) {
      const itemToUpdate = { ...newCategories[catIndex].items[itemIndex] };

      if (field === 'priceAmount') {
        if (typeof itemToUpdate.itemPrice === 'number') {
          itemToUpdate.itemPrice = Number(value);
        } else {
          itemToUpdate.price = {
            ...(itemToUpdate.price || { currency: 'USD' }),
            amount: Number(value)
          };
        }
      } else if (field === 'priceCurrency') {
        if (typeof itemToUpdate.itemPrice === 'number') {
          itemToUpdate.price = {
            amount: itemToUpdate.itemPrice,
            currency: String(value)
          };
          itemToUpdate.itemPrice = undefined;
        } else {
          itemToUpdate.price = {
            ...(itemToUpdate.price || { amount: 0 }),
            currency: String(value)
          };
        }
      } else if (field === 'name') {
        itemToUpdate.name = String(value);
        itemToUpdate.itemName = String(value);
      } else if (field === 'description') {
        itemToUpdate.description = String(value);
        itemToUpdate.itemDescription = String(value);
      } else if (field === 'isAvailable' || field === 'isPopular') {
        itemToUpdate[field] = Boolean(value);
      } else if (field === 'itemType') {
        itemToUpdate.itemType = value === 'item' || value === 'modifier' ? value : 'item';
      } else if (field === 'dietaryTags') {
        itemToUpdate.dietaryTags = Array.isArray(value) 
          ? value.map(String)
          : typeof value === 'string' 
            ? value.split(',').map(tag => tag.trim()).filter(tag => tag)
            : [];
      }
      
      newCategories[catIndex].items[itemIndex] = itemToUpdate;
      setCategories(newCategories);
    } else {
      console.error("Invalid category or item index in handleItemChange");
    }
  };

  // Add a new empty category
  const handleAddCategory = () => {
    const newCategory: Category = {
      categoryName: "",
      categoryDescription: "",
      items: [],
      isEditing: true,
      frontendId: `new-category-${Date.now()}`
    };
    
    setCategories([...categories, newCategory]);
  };

  // Add a new empty item to a category
  const handleAddItem = (catIndex: number) => {
    const updatedCategories = [...categories];
    const newItem: NestedMenuItem = {
      itemName: "",
      itemDescription: "",
      itemPrice: 0,
      frontendId: `new-item-${Date.now()}-${catIndex}`
    };
    
    updatedCategories[catIndex].items.push(newItem);
    setCategories(updatedCategories);
  };

  // Toggle editing mode for a category
  const toggleEditCategory = (categoryId: string) => {
    setCategories(prevCategories => 
      prevCategories.map(category => {
        if (category.docId === categoryId || category.frontendId === categoryId) {
          return { ...category, isEditing: !category.isEditing };
        }
        return category;
      })
    );
  };

  // Update customizations for a specific item
  const updateItemCustomizations = (itemFrontendId: string | undefined, newCustomizations: CustomizationGroup[]) => {
    if (!itemFrontendId) {
      toast.error("Item ID is missing, cannot update customizations.");
      return;
    }

    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        items: category.items.map(item => 
          item.frontendId === itemFrontendId 
            ? { ...item, customizations: newCustomizations }
            : item
        )
      }))
    );
    toast.success('Item customizations updated locally.');
  };

  const updateItemLinkedExtras = (itemFrontendId: string | undefined, linkedExtraGroupIds: string[]) => {
    if (!itemFrontendId) {
      toast.error("Item ID is missing, cannot update linked extras.");
      return;
    }

    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        items: category.items.map(item => 
          item.frontendId === itemFrontendId 
            ? { ...item, linkedReusableExtraIds: linkedExtraGroupIds } 
            : item
        )
      }))
    );
    toast.success('Item linked extras updated locally.');
  };

  // Save a category and its items to Firestore
  async function handleSaveCategory(categoryId: string): Promise<void> {
    const categoryIndex = categories.findIndex(cat => cat.docId === categoryId || cat.frontendId === categoryId);
    if (categoryIndex === -1) {
      toast.error("Category not found for saving.");
      return;
    }

    const category = categories[categoryIndex];
    if (!category) {
      toast.error("Invalid category data.");
      return;
    }

    if (!category.categoryName?.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);

    try {
      // Prepare items for Firestore: remove frontendId and any other client-side-only properties
      const itemsForFirestore = category.items.map(({ frontendId, isEditing, ...itemData }) => {
        // Ensure customizations are included if they exist
        const itemToSave: Omit<NestedMenuItem, 'frontendId' | 'isEditing'> & { customizations?: CustomizationGroup[] } = { ...itemData };
        if (itemData.customizations && itemData.customizations.length > 0) {
          itemToSave.customizations = itemData.customizations;
        } else {
          delete itemToSave.customizations;
        }
        return itemToSave;
      });
      
      // Check if category exists (has docId) or needs to be created
      if (category.docId) {
        // Update existing category
        const categoryRef = doc(db, "restaurants", restaurantId, "menu", category.docId);
        await updateDoc(categoryRef, {
          categoryName: category.categoryName,
          categoryDescription: category.categoryDescription || "",
          items: itemsForFirestore
        });
        
        toast.success("Category updated successfully");
      } else {
        // Create new category
        const categoryData = {
          categoryName: category.categoryName,
          categoryDescription: category.categoryDescription || "",
          items: itemsForFirestore
        };
        
        const docRef = await addDoc(collection(db, "restaurants", restaurantId, "menu"), categoryData);
        
        // Update local state with the new docId
        setCategories(prevCategories => {
          const newCategories = [...prevCategories];
          newCategories[categoryIndex] = {
            ...newCategories[categoryIndex],
            docId: docRef.id,
            isEditing: false
          };
          return newCategories;
        });
        
        toast.success("Category added successfully");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setLoading(false);
    }
  }

  // Handle deleting a category
  const handleDeleteCategory = (catIndex: number) => {
    const category = categories[catIndex];
    
    const openConfirmDialog = () => {
      setConfirmDialog({
        isOpen: true,
        title: "Delete Category",
        message: `Are you sure you want to delete "${category.categoryName || 'Unnamed Category'}" and all its items? This action cannot be undone.`,
        onConfirm: async () => {
          setLoading(true);
          
          try {
            if (category.docId) {
              // Delete from Firestore if it exists there
              await deleteDoc(doc(db, "restaurants", restaurantId, "menu", category.docId));
            }
            
            // Remove from local state
            const updatedCategories = [...categories];
            updatedCategories.splice(catIndex, 1);
            setCategories(updatedCategories);
            
            toast.success("Category deleted successfully");
          } catch (error) {
            console.error("Error deleting category:", error);
            toast.error("Failed to delete category");
          } finally {
            setLoading(false);
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        }
      });
    };
    
    openConfirmDialog();
  };

  // Handle deleting a menu item
  const handleDeleteItem = (catIndex: number, itemIndex: number) => {
    const category = categories[catIndex];
    const item = category.items[itemIndex];
    
    const openConfirmDialog = () => {
      setConfirmDialog({
        isOpen: true,
        title: "Delete Item",
        message: `Are you sure you want to delete "${item.itemName || 'Unnamed Item'}"? This action cannot be undone.`,
        onConfirm: async () => {
          setLoading(true);
          
          try {
            if (category.docId) {
              // For items in Firestore, we need to update the array
              const categoryRef = doc(db, "restaurants", restaurantId, "menu", category.docId);
              
              // Remove frontendId before updating Firestore
              const { frontendId, ...itemWithoutFrontendId } = item;
              
              await updateDoc(categoryRef, {
                // Remove the item from the items array
                items: arrayRemove(itemWithoutFrontendId)
              });
            }
            
            // Update local state
            const updatedCategories = [...categories];
            updatedCategories[catIndex].items.splice(itemIndex, 1);
            setCategories(updatedCategories);
            
            toast.success("Item deleted successfully");
          } catch (error) {
            console.error("Error deleting item:", error);
            toast.error("Failed to delete item");
          } finally {
            setLoading(false);
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        }
      });
    };
    
    openConfirmDialog();
  };

  // --- Reusable Extras Library Functions ---
  const fetchReusableExtras = async () => {
    if (!restaurantId) {
      setReusableExtras([]);
      setLoadingExtras(false);
      return;
    }
    setLoadingExtras(true);
    try {
      const extrasRef = collection(db, "restaurants", restaurantId, "reusableExtraGroups");
      const querySnapshot = await getDocs(extrasRef);
      const fetchedExtras = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ReusableExtraGroup));
      setReusableExtras(fetchedExtras);
      toast.success("Reusable extras loaded successfully.");
    } catch (error) {
      console.error("Error fetching reusable extras:", error);
      toast.error("Failed to load reusable extras.");
      setReusableExtras([]); // Clear on error to avoid inconsistent state
    } finally {
      setLoadingExtras(false);
    }
  };

  const addReusableExtraGroup = async (groupData: Omit<ReusableExtraGroup, 'id'>) => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return null;
    }
    setLoadingExtras(true); // Indicate loading state for this operation
    try {
      const extrasRef = collection(db, "restaurants", restaurantId, "reusableExtraGroups");
      const docRef = await addDoc(extrasRef, groupData);
      const newGroup = { ...groupData, id: docRef.id };
      setReusableExtras(prev => [...prev, newGroup]);
      toast.success("Reusable extra group added successfully.");
      return docRef.id;
    } catch (error) {
      console.error("Error adding reusable extra group:", error);
      toast.error("Failed to add reusable extra group.");
      return null;
    } finally {
      setLoadingExtras(false);
    }
  };

  const updateReusableExtraGroup = async (groupId: string, groupData: Partial<Omit<ReusableExtraGroup, 'id'>>) => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return;
    }
    setLoadingExtras(true);
    try {
      const groupRef = doc(db, "restaurants", restaurantId, "reusableExtraGroups", groupId);
      await updateDoc(groupRef, groupData);
      setReusableExtras(prev => prev.map(g => g.id === groupId ? { ...g, ...groupData, id: groupId } : g)); // Ensure id is preserved
      toast.success("Reusable extra group updated successfully.");
    } catch (error) {
      console.error("Error updating reusable extra group:", error);
      toast.error("Failed to update reusable extra group.");
    } finally {
      setLoadingExtras(false);
    }
  };

  const deleteReusableExtraGroup = async (groupId: string) => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return;
    }
    // Confirmation dialog for deleting a reusable group
    setConfirmDialog({
      isOpen: true,
      title: "Delete Reusable Extra Group",
      message: `Are you sure you want to delete this reusable extra group? This action cannot be undone and might affect items using it.`, // Added warning
      onConfirm: async () => {
        setLoadingExtras(true);
        try {
          const groupRef = doc(db, "restaurants", restaurantId, "reusableExtraGroups", groupId);
          await deleteDoc(groupRef);
          setReusableExtras(prev => prev.filter(g => g.id !== groupId));
          toast.success("Reusable extra group deleted successfully.");
          // TODO: Consider adding logic here or in a separate function to find and update items
          // that were using this deleted group (e.g., remove the linkedReusableExtraIds).
        } catch (error) {
          console.error("Error deleting reusable extra group:", error);
          toast.error("Failed to delete reusable extra group.");
        } finally {
          setLoadingExtras(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };
  // --- End Reusable Extras Library Functions ---

  return {
    categories,
    loading,
    confirmDialog,
    setConfirmDialog,
    fetchMenuData, // If manual refresh is needed
    handleCategoryChange,
    handleItemChange,
    handleAddCategory,
    handleAddItem,
    toggleEditCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleDeleteItem,
    updateItemCustomizations, 
    updateItemLinkedExtras, // Expose the new function
    // For Reusable Extras Library
    reusableExtras,
    loadingExtras,
    fetchReusableExtras,
    addReusableExtraGroup,
    updateReusableExtraGroup,
    deleteReusableExtraGroup,
  };
}