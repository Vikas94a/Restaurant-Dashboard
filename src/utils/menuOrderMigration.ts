import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Migrates existing menu categories to include order fields
 * This function should be called once to update existing data
 */
export async function migrateMenuCategoriesOrder(restaurantId: string): Promise<void> {
  try {
    const menuRef = collection(db, "restaurants", restaurantId, "menu");
    const querySnapshot = await getDocs(menuRef);
    
    if (querySnapshot.empty) {
      console.log('No menu categories found to migrate');
      return;
    }

    const updatePromises = querySnapshot.docs.map((docSnapshot, index) => {
      const data = docSnapshot.data();
      
      // Only update if order field doesn't exist
      if (data.order === undefined) {
        const categoryRef = doc(db, "restaurants", restaurantId, "menu", docSnapshot.id);
        return updateDoc(categoryRef, {
          order: index
        });
      }
      
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
    console.log(`Successfully migrated ${querySnapshot.docs.length} menu categories`);
  } catch (error) {
    console.error('Error migrating menu categories order:', error);
    throw error;
  }
}

/**
 * Ensures all categories have proper order values
 * This function can be called to fix any missing order values
 */
export async function ensureMenuCategoriesOrder(restaurantId: string): Promise<void> {
  try {
    const menuRef = collection(db, "restaurants", restaurantId, "menu");
    const menuQuery = query(menuRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(menuQuery);
    
    if (querySnapshot.empty) {
      return;
    }

    const updatePromises = querySnapshot.docs.map((docSnapshot, index) => {
      const data = docSnapshot.data();
      const currentOrder = data.order;
      
      // Update if order is missing or doesn't match the expected order
      if (currentOrder === undefined || currentOrder !== index) {
        const categoryRef = doc(db, "restaurants", restaurantId, "menu", docSnapshot.id);
        return updateDoc(categoryRef, {
          order: index
        });
      }
      
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
    console.log('Menu categories order verified and updated');
  } catch (error) {
    console.error('Error ensuring menu categories order:', error);
    throw error;
  }
} 