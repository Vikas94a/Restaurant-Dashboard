import { db } from '@/lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Define the structure of a menu item as it appears within a category's items array
export interface NestedMenuItem {
  // No ID field here as it's not a separate document
  itemName: string;
  itemDescription?: string;
  itemPrice: number;
  // Assuming no imageUrl or isAvailable at the item level based on your structure
}

// Define the structure of a category document as it appears in Firestore
export interface FirestoreCategory {
  id?: string; // Document ID
  categoryName: string;
  categoryDescription?: string;
  items: NestedMenuItem[]; // Array of nested menu items
}

// Define the structure of a menu item for the frontend, including its category ID
export interface FrontendMenuItem extends NestedMenuItem {
  // We'll generate a temporary ID for frontend use (e.g., for keys)
  // A real ID might require a change to your Firestore structure or a more complex approach
  frontendId: string; 
  categoryId: string; // Reference to the parent category document ID
}

// Define the structure of a category for the frontend
export interface FrontendCategory {
  id: string; // Document ID
  name: string;
  description?: string;
}

export const menuService = {
  // Get all categories for a restaurant, converting to frontend structure
  async getCategories(restaurantId: string): Promise<FrontendCategory[]> {
    const categoriesRef = collection(db, 'restaurants', restaurantId, 'categories');
    const snapshot = await getDocs(categoriesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().categoryName || '',
      description: doc.data().categoryDescription || ''
    }));
  },

  // Get all menu items for a restaurant by fetching from categories, converting to frontend structure
  async getMenuItems(restaurantId: string): Promise<FrontendMenuItem[]> {
    const categoriesRef = collection(db, 'restaurants', restaurantId, 'categories');
    const snapshot = await getDocs(categoriesRef);
    let allMenuItems: FrontendMenuItem[] = [];

    snapshot.docs.forEach(doc => {
      const categoryId = doc.id;
      const categoryData = doc.data() as FirestoreCategory;
      if (categoryData.items && Array.isArray(categoryData.items)) {
        categoryData.items.forEach((item, index) => {
          // Generate a simple frontend ID for list keys/identification
          const frontendId = `${categoryId}-${index}`;
          allMenuItems.push({
            ...item,
            frontendId: frontendId,
            categoryId: categoryId,
            // Ensure itemPrice is a number, default to 0 if not
            itemPrice: typeof item.itemPrice === 'number' ? item.itemPrice : 0,
          });
        });
      }
    });

    return allMenuItems;
  },

  // Add a new menu item to a category's items array
  async addMenuItem(restaurantId: string, categoryId: string, menuItem: NestedMenuItem): Promise<void> {
    const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
    // Validate itemPrice to ensure it's a number
    const validatedItem = { ...menuItem, itemPrice: typeof menuItem.itemPrice === 'number' ? menuItem.itemPrice : 0 };
    await updateDoc(categoryRef, {
      items: arrayUnion(validatedItem)
    });
  },

  // Update an existing menu item within a category's items array
  // This is more complex as Firestore doesn't directly support updating array elements by value
  // A common approach is to remove the old item and add the new one.
  // This assumes item identity within the array can be determined by its content.
  // If items can have identical content, a unique field (like a timestamp or generated ID) would be needed in the nested structure.
  async updateMenuItem(restaurantId: string, categoryId: string, oldMenuItem: NestedMenuItem, newMenuItem: NestedMenuItem): Promise<void> {
     const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
     // Remove the old item
     await updateDoc(categoryRef, {
       items: arrayRemove(oldMenuItem)
     });
     // Add the new item
     await updateDoc(categoryRef, {
       items: arrayUnion(newMenuItem)
     });
  },

  // Delete a menu item from a category's items array
  async deleteMenuItem(restaurantId: string, categoryId: string, menuItem: NestedMenuItem): Promise<void> {
    const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
    await updateDoc(categoryRef, {
      items: arrayRemove(menuItem)
    });
  },

  // Add a new category document
  async addCategory(restaurantId: string, category: Omit<FrontendCategory, 'id'>): Promise<string> {
    const categoriesRef = collection(db, 'restaurants', restaurantId, 'categories');
    const docRef = await addDoc(categoriesRef, {
      categoryName: category.name || '',
      categoryDescription: category.description || '',
      items: [] // Initialize with an empty items array
    });
    return docRef.id;
  },

  // Update a category document (name/description)
  async updateCategory(restaurantId: string, categoryId: string, updates: Partial<Omit<FrontendCategory, 'id'>>): Promise<void> {
    const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
    // Map frontend updates back to Firestore field names
    const firestoreUpdates: any = {};
    if (updates.name !== undefined) {
        firestoreUpdates.categoryName = updates.name;
    }
    if (updates.description !== undefined) {
        firestoreUpdates.categoryDescription = updates.description;
    }
    if (Object.keys(firestoreUpdates).length > 0) {
        await updateDoc(categoryRef, firestoreUpdates);
    }
  },

  // Delete a category document (and all its nested items)
  async deleteCategory(restaurantId: string, categoryId: string): Promise<void> {
    const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
    await deleteDoc(categoryRef);
  }
};