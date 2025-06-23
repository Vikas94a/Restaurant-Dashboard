import { doc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NestedMenuItem, LegacyMenuItem, Category } from '../menuTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a standardized menu item from either new or legacy data format
 */
export const normalizeMenuItemData = (
  item: Partial<NestedMenuItem> | LegacyMenuItem,
  index?: number
): NestedMenuItem => {
  // Generate an ID if one doesn't exist
  const id = String(item.id || `item-${index || uuidv4()}`);
  
  // Extract name from either format
  const name = String(item.name || (item as LegacyMenuItem).itemName || '');
  
  // Extract description from either format
  const description = String(item.description || (item as LegacyMenuItem).itemDescription || '');
  
  // Extract and normalize price data
  const priceAmount = Number(
    (item as NestedMenuItem).price?.amount ?? 
    (item as LegacyMenuItem).itemPrice ?? 
    0
  );
  
  return {
    id,
    name,
    description,
    price: {
      amount: priceAmount,
      currency: String((item as NestedMenuItem).price?.currency ?? 'USD'),
    },
    imageUrl: (item as NestedMenuItem).imageUrl ? String((item as NestedMenuItem).imageUrl) : undefined,
    category: (item as NestedMenuItem).category ? String((item as NestedMenuItem).category) : undefined,
    isAvailable: Boolean((item as NestedMenuItem).isAvailable ?? true),
    isPopular: Boolean((item as NestedMenuItem).isPopular ?? false),
    dietaryTags: Array.isArray((item as NestedMenuItem).dietaryTags) 
      ? (item as NestedMenuItem).dietaryTags!.map(String) 
      : [],
    customizations: (item as NestedMenuItem).customizations ?? [],
    linkedReusableExtras: (item as NestedMenuItem).linkedReusableExtras ?? {},
    linkedReusableExtraIds: Array.isArray((item as NestedMenuItem).linkedReusableExtraIds)
      ? (item as NestedMenuItem).linkedReusableExtraIds!.map(String)
      : [],
    subItems: (item as NestedMenuItem).subItems ?? [],
    itemType: ((item as NestedMenuItem).itemType === 'modifier' ? 'modifier' : 'item') as 'item' | 'modifier',
  };
};

/**
 * Cleans a menu item for Firestore storage by removing client-side only properties
 */
export const cleanItemForFirestore = (item: NestedMenuItem): Omit<NestedMenuItem, 'id'> => {
  return {
    name: item.name,
    description: item.description,
    price: {
      amount: item.price?.amount ?? 0,
      currency: item.price?.currency ?? 'USD',
    },
    imageUrl: item.imageUrl ?? '',
    category: item.category ?? '',
    isAvailable: item.isAvailable ?? true,
    isPopular: item.isPopular ?? false,
    dietaryTags: item.dietaryTags ?? [],
    customizations: item.customizations ?? [],
    linkedReusableExtras: item.linkedReusableExtras ?? {},
    linkedReusableExtraIds: item.linkedReusableExtraIds ?? [],
    subItems: item.subItems ?? [],
    itemType: item.itemType ?? 'item',
  };
};

/**
 * Migrates all restaurant menu data to the new format
 */
export const migrateRestaurantMenuData = async (
  restaurantId: string
): Promise<{ success: boolean; message: string }> => {
  if (!restaurantId) {
    return { success: false, message: 'Restaurant ID is required' };
  }

  try {
    // Get all categories from the menu
    const menuRef = collection(db, "restaurants", restaurantId, "menu");
    const querySnapshot = await getDocs(menuRef);

    if (querySnapshot.empty) {
      return { success: true, message: 'No menu data to migrate' };
    }

    // Create a batch to update all documents at once
    const batch = writeBatch(db);
    let migrationCount = 0;

    querySnapshot.docs.forEach((docSnapshot) => {
      const categoryData = docSnapshot.data() as Category;
      const categoryRef = doc(db, "restaurants", restaurantId, "menu", docSnapshot.id);
      
      // Check if this category has items that need migration
      const hasLegacyItems = categoryData.items?.some(
        item => {
          const legacyItem = item as unknown as LegacyMenuItem;
          return legacyItem.itemName !== undefined ||
                 legacyItem.itemDescription !== undefined ||
                 legacyItem.itemPrice !== undefined;
        }
      );
      
      if (hasLegacyItems) {
        // Normalize all items in this category
        const normalizedItems = (categoryData.items || []).map(
          (item, index) => normalizeMenuItemData(item as unknown as LegacyMenuItem, index)
        );
        
        // Update the category with normalized items
        batch.update(categoryRef, { items: normalizedItems });
        migrationCount++;
      }
    });

    // Commit the batch if we have changes to make
    if (migrationCount > 0) {
      await batch.commit();
      return { 
        success: true, 
        message: `Successfully migrated ${migrationCount} categories to the new format` 
      };
    }
    
    return { success: true, message: 'All menu data is already in the new format' };
  } catch (error) {
    console.error('Error migrating menu data:', error);
    return { 
      success: false, 
      message: `Failed to migrate menu data: ${(error as Error).message}` 
    };
  }
}; 