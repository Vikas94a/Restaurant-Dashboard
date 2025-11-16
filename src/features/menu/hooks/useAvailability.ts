/**
 * useAvailability - Hook for managing item availability with instant updates
 * Updates Firebase immediately without requiring Edit mode
 * Uses optimistic UI updates with rollback on failure
 */

"use client";

import { useCallback } from 'react';
import { toast } from 'sonner';
import { AvailabilityState } from '../types/availability';
import { Category } from '@/utils/menuTypes';
import { updateItemAvailabilityInFirestore, findItemInCategories } from '../services/menuAvailability';

interface UseAvailabilityProps {
  restaurantId: string;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

/**
 * Hook for managing item availability with instant updates
 * Updates Firebase immediately without requiring Edit mode
 * Uses optimistic UI updates with rollback on failure
 */
export function useAvailability({
  restaurantId,
  categories,
  setCategories,
}: UseAvailabilityProps) {
  const updateItemAvailability = useCallback(async (
    itemId: string,
    availability: AvailabilityState
  ) => {
    // Find the item in categories
    const found = findItemInCategories(categories, itemId);
    if (!found) {
      toast.error('Kunne ikke finne produktet');
      return;
    }

    const { category, categoryIndex, item, itemIndex } = found;
    const categoryId = category.docId || category.frontendId || '';
    
    if (!categoryId) {
      toast.error('Kunne ikke finne kategori-ID');
      return;
    }

    if (!category.items) {
      toast.error('Kunne ikke finne produkter i kategorien');
      return;
    }

    // Store original state for rollback
    const originalAvailability = item.availability || {
      status: (item.isAvailable ? 'available' : 'unavailable_indefinite') as 'available' | 'unavailable_indefinite',
      until: null,
    };

    // Optimistic update - update local state immediately
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories];
      const updatedCategory = { ...updatedCategories[categoryIndex] };
      const updatedItems = [...(updatedCategory.items || [])];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        availability,
        isAvailable: availability.status === 'available',
      };
      updatedCategory.items = updatedItems;
      updatedCategories[categoryIndex] = updatedCategory;
      return updatedCategories;
    });

    try {
      // Update Firestore
      await updateItemAvailabilityInFirestore(
        restaurantId,
        categoryId,
        itemId,
        availability,
        category.items
      );

      toast.success('Tilgjengelighet oppdatert');
    } catch (error) {
      console.error('Failed to update availability:', error);
      
      // Rollback optimistic update
      setCategories((prevCategories) => {
        const updatedCategories = [...prevCategories];
        const updatedCategory = { ...updatedCategories[categoryIndex] };
        const updatedItems = [...(updatedCategory.items || [])];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          availability: originalAvailability,
          isAvailable: originalAvailability.status === 'available',
        };
        updatedCategory.items = updatedItems;
        updatedCategories[categoryIndex] = updatedCategory;
        return updatedCategories;
      });
      
      // Show user-friendly error message
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('reklameblokkering') || message.includes('blocked') || message.includes('err_blocked')) {
          toast.warning('Nettverksforespørsel blokkert. Deaktiver reklameblokkering for denne siden.', { duration: 6000 });
        } else if (message.includes('tillatelse') || message.includes('permission')) {
          toast.error('Du har ikke tillatelse til å oppdatere dette produktet');
        } else {
          toast.error('Kunne ikke oppdatere tilgjengelighet');
        }
      } else {
        toast.error('Kunne ikke oppdatere tilgjengelighet');
      }
    }
  }, [restaurantId, categories, setCategories]);

  return { updateItemAvailability };
}

