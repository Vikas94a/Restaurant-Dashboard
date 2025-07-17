import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, writeBatch, query, orderBy } from 'firebase/firestore';
import { Category, ReusableExtraGroup, Item } from '@/utils/menuTypes';
import { toast } from "sonner";

// Cache for menu data
const menuCache = new Map<string, { data: Category[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Error messages can be defined here since they were previously in types/menu.ts
export const MENU_EDITOR_ERROR_MESSAGES = {
  INVALID_CATEGORY: 'Invalid category data',
  INVALID_ITEM: 'Invalid item data',
  INVALID_EXTRA_GROUP: 'Invalid extra group data',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred'
} as const;

/**
 * Helper function to get user-friendly error messages
 */
export function getMenuEditorErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const errorCode = error.message;
    return MENU_EDITOR_ERROR_MESSAGES[errorCode as keyof typeof MENU_EDITOR_ERROR_MESSAGES] || MENU_EDITOR_ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  return MENU_EDITOR_ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Menu Operations
 */
export async function fetchMenuData(restaurantId: string): Promise<Category[]> {
  try {
    // Check cache first
    const cachedData = menuCache.get(restaurantId);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }

    // If not in cache or cache expired, fetch from Firestore
    const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
    const menuQuery = query(menuRef, orderBy('categoryName'));
    const snapshot = await getDocs(menuQuery);
    
    const categories = snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data(),
      items: doc.data().items?.map((item: Item) => ({
        ...item,
        id: item.id || doc.id,
      })) || [],
    })) as Category[];

    // Update cache
    menuCache.set(restaurantId, {
      data: categories,
      timestamp: Date.now()
    });

    return categories;
  } catch (error) {
    const errorMessage = getMenuEditorErrorMessage(error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function saveCategory(restaurantId: string, category: Category): Promise<string> {
  try {
    const batch = writeBatch(db);
    const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
    
    // Create new category document
    const newCategoryRef = doc(menuRef);
    batch.set(newCategoryRef, {
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription,
      items: category.items || [],
    });

    // Commit the batch
    await batch.commit();

    // Invalidate cache
    menuCache.delete(restaurantId);

    return newCategoryRef.id;
  } catch (error) {
    const errorMessage = getMenuEditorErrorMessage(error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function deleteCategory(restaurantId: string, categoryId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const categoryRef = doc(db, 'restaurants', restaurantId, 'menu', categoryId);
    
    // Delete the category
    batch.delete(categoryRef);

    // Commit the batch
    await batch.commit();

    // Invalidate cache
    menuCache.delete(restaurantId);
  } catch (error) {
    const errorMessage = getMenuEditorErrorMessage(error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Reusable Extras Operations
 */
export async function fetchReusableExtras(restaurantId: string): Promise<ReusableExtraGroup[]> {
  try {
    const extrasRef = collection(db, 'restaurants', restaurantId, 'reusableExtras');
    const extrasQuery = query(extrasRef, orderBy('name'));
    const snapshot = await getDocs(extrasQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ReusableExtraGroup[];
  } catch (error) {
    const errorMessage = getMenuEditorErrorMessage(error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function saveReusableExtraGroup(restaurantId: string, group: ReusableExtraGroup): Promise<string> {
  try {
    const extrasRef = collection(db, 'restaurants', restaurantId, 'reusableExtras');
    const docRef = await addDoc(extrasRef, {
      groupName: group.groupName,
      selectionType: group.selectionType,
      choices: group.choices,
    });
    return docRef.id;
  } catch (error) {
    const errorMessage = getMenuEditorErrorMessage(error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function updateReusableExtraGroup(restaurantId: string, groupId: string, group: ReusableExtraGroup): Promise<void> {
  try {
    const groupRef = doc(db, 'restaurants', restaurantId, 'reusableExtras', groupId);
    await updateDoc(groupRef, {
      groupName: group.groupName,
      selectionType: group.selectionType,
      choices: group.choices,
    });
  } catch (error) {
    const errorMessage = getMenuEditorErrorMessage(error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function deleteReusableExtraGroup(restaurantId: string, groupId: string): Promise<void> {
  try {
    const groupRef = doc(db, 'restaurants', restaurantId, 'reusableExtras', groupId);
    await deleteDoc(groupRef);
    await cleanupOrphanedExtraReferences(restaurantId, groupId);
  } catch (error) {
    const errorMessage = getMenuEditorErrorMessage(error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Cleanup Operations
 */
async function cleanupOrphanedExtraReferences(restaurantId: string, groupId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
    const snapshot = await getDocs(menuRef);

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.items) {
        const updatedItems = data.items.map((item: Item) => {
          if (item.linkedReusableExtras && item.linkedReusableExtras[groupId]) {
            const updatedExtras = { ...item.linkedReusableExtras };
            delete updatedExtras[groupId];
            return {
              ...item,
              linkedReusableExtras: updatedExtras,
              linkedReusableExtraIds: item.linkedReusableExtraIds?.filter(
                (id: string) => id !== groupId
              ) || []
            };
          }
          return item;
        });

        batch.update(doc.ref, { items: updatedItems });
      }
    });

    await batch.commit();
    menuCache.delete(restaurantId);
  } catch (error) {
    const errorMessage = getMenuEditorErrorMessage(error);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
} 