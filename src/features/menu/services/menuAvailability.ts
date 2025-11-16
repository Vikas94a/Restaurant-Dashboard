/**
 * Menu Availability Service
 * Handles Firebase updates for item availability
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AvailabilityState } from '../types/availability';
import { Category, NestedMenuItem } from '@/utils/menuTypes';

/**
 * Helper to remove undefined values (Firestore doesn't accept undefined)
 */
function removeUndefined(obj: unknown): unknown {
  if (obj === null) return null;
  if (obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter((item) => item !== undefined);
  }
  if (typeof obj === 'object' && obj !== null && obj.constructor === Object) {
    const cleaned: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key as keyof typeof obj] !== undefined) {
        const cleanedValue = removeUndefined(obj[key as keyof typeof obj]);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Update item availability in Firestore
 */
export async function updateItemAvailabilityInFirestore(
  restaurantId: string,
  categoryId: string,
  itemId: string,
  availability: AvailabilityState,
  currentItems: NestedMenuItem[]
): Promise<void> {
  // Find the item index
  const itemIndex = currentItems.findIndex(
    (item) => (item.id || item.frontendId) === itemId
  );

  if (itemIndex === -1) {
    throw new Error('Kunne ikke finne produktet');
  }

  // Create updated items array
  const updatedItems = [...currentItems];
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    availability,
    isAvailable: availability.status === 'available',
  };

  // Clean items for Firestore
  const cleanedItems = updatedItems.map((item) => {
    const itemAvailability = item.availability || {
      status: (item.isAvailable ? 'available' : 'unavailable_indefinite') as 'available' | 'unavailable_indefinite',
      until: null,
    };

    const cleanedItem: Record<string, unknown> = {
      id: item.id || item.frontendId || '',
      name: item.name || '',
      description: item.description || '',
      price: {
        amount: item.price?.amount || 0,
        currency: item.price?.currency || 'NOK',
      },
      isAvailable: itemAvailability.status === 'available',
      availability: itemAvailability,
    };

    if (item.imageUrl) cleanedItem.imageUrl = item.imageUrl;
    if (item.isPopular !== undefined) cleanedItem.isPopular = Boolean(item.isPopular);
    if (item.dietaryTags && Array.isArray(item.dietaryTags) && item.dietaryTags.length > 0) {
      cleanedItem.dietaryTags = item.dietaryTags;
    }
    if (item.customizations && Array.isArray(item.customizations) && item.customizations.length > 0) {
      cleanedItem.customizations = item.customizations;
    }
    if (item.linkedReusableExtraIds && Array.isArray(item.linkedReusableExtraIds) && item.linkedReusableExtraIds.length > 0) {
      cleanedItem.linkedReusableExtraIds = item.linkedReusableExtraIds;
    }
    if (item.frontendId) cleanedItem.frontendId = item.frontendId;
    if (item.category) cleanedItem.category = item.category;

    return removeUndefined(cleanedItem);
  });

  // Update Firestore - Use correct collection path: "menu" not "menuCategories"
  const categoryRef = doc(db, `restaurants/${restaurantId}/menu`, categoryId);
  await updateDoc(categoryRef, {
    items: cleanedItems,
  });
}

/**
 * Find item and category from itemId
 */
export function findItemInCategories(
  categories: Category[],
  itemId: string
): { category: Category; categoryIndex: number; item: NestedMenuItem; itemIndex: number } | null {
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const itemIndex = category.items?.findIndex(
      (item) => (item.id || item.frontendId) === itemId
    );
    if (itemIndex !== -1 && itemIndex !== undefined && category.items) {
      return {
        category,
        categoryIndex: i,
        item: category.items[itemIndex],
        itemIndex,
      };
    }
  }
  return null;
}

