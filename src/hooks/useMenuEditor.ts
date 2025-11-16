"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { normalizeMenuItemData } from '@/utils/firebase/menu';
import { useMenuCategoryOperations } from './menu/useMenuCategoryOperations';
import { useMenuItemOperations } from './menu/useMenuItemOperations';
import { useReusableExtraOperations } from './menu/useReusableExtraOperations';
import { migrateRestaurantMenuData } from '@/utils/firebase/menu';
import { NestedMenuItem, LegacyMenuItem, Category, CustomizationGroup, ItemChangeField } from '@/utils/menuTypes';

// Error message mapping for menu editor operations
export const MENU_EDITOR_ERROR_MESSAGES = {
  'not-found': 'Menu item not found. Please try again.',
  'permission-denied': 'You do not have permission to edit this menu.',
  'unavailable': 'Menu editor service is currently unavailable.',
  'invalid-data': 'Invalid menu data provided.',
  'network-error': 'Network error. Please check your connection.',
  'save-failed': 'Failed to save menu changes. Please try again.',
  'delete-failed': 'Failed to delete menu item. Please try again.',
  'update-failed': 'Failed to update menu item. Please try again.',
  'default': 'An unexpected error occurred while editing the menu.'
} as const;

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface MenuEditorResult {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  loading: boolean;
  loadingExtras: boolean;
  error: string | null;
  confirmDialog: ConfirmDialog;
  reusableExtras: CustomizationGroup[];
  setError: (error: string | null) => void;
  setConfirmDialog: (dialog: ConfirmDialog) => void;
  handleAddCategory: () => void;
  handleAddItem: (categoryIndex: number) => Promise<void>;
  toggleEditCategory: (categoryIndex: number) => void;
  handleSaveCategory: (categoryIndex: number) => Promise<void>;
  handleDeleteCategory: (categoryIndex: number) => Promise<void>;
  handleDeleteItem: (categoryIndex: number, itemIndex: number) => Promise<void>;
  updateItemCustomizations: (itemId: string, customizations: CustomizationGroup[]) => void;
  handleCategoryChange: (categoryIndex: number, field: keyof Pick<Category, 'categoryName' | 'categoryDescription'>, value: string) => void;
  handleItemChange: (categoryIndex: number, itemIndex: number, field: ItemChangeField, value: string | number | boolean | string[]) => void;
  addReusableExtraGroup: (groupData: Omit<CustomizationGroup, 'id'>) => Promise<string | null>;
  updateReusableExtraGroup: (groupId: string, groupData: Partial<Omit<CustomizationGroup, 'id'>>) => Promise<void>;
  deleteReusableExtraGroup: (groupId: string) => Promise<void>;
  updateItemLinkedExtras: (itemId: string, groupIds: string[]) => Promise<void>;
  migrateMenuData: () => Promise<{ success: boolean; message: string }>;
  toggleItemAvailability: (itemId: string) => void;
  reorderCategories: (startIndex: number, endIndex: number) => void;
  saveCategoryOrder: () => Promise<void>;
}

export function useMenuEditor(restaurantId: string): MenuEditorResult {
  // State hooks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // Custom hooks
  const {
    categories,
    setCategories,
    handleAddCategory,
    toggleEditCategory,
    handleCategoryChange,
    handleSaveCategory,
    handleDeleteCategory,
    reorderCategories,
    saveCategoryOrder,
  } = useMenuCategoryOperations({
    restaurantId,
    setError,
    setLoading,
    setConfirmDialog,
  });

  const {
    handleAddItem,
    handleItemChange,
    handleDeleteItem,
    updateItemCustomizations,
    updateItemLinkedExtras,
  } = useMenuItemOperations({
    restaurantId,
    categories,
    setCategories,
    setError,
    setLoading,
    setConfirmDialog,
  });

  const {
    reusableExtras,
    loadingExtras,
    addReusableExtraGroup,
    updateReusableExtraGroup,
    deleteReusableExtraGroup,
  } = useReusableExtraOperations({
    restaurantId,
    setConfirmDialog,
  });

  // Fetch initial menu data
  useEffect(() => {
    const fetchMenuData = async () => {
      if (!restaurantId) {
        setLoading(false);
        setCategories([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const menuRef = collection(db, "restaurants", restaurantId, "menu");
        const menuQuery = query(menuRef, orderBy('order', 'asc'));
        const querySnapshot = await getDocs(menuQuery);

        if (querySnapshot.empty) {
          setCategories([{
            categoryName: "",
            categoryDescription: "",
            items: [],
            isEditing: true,
            frontendId: uuidv4()
          }]);
        } else {
          const fetchedCategories = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const itemsWithFrontendIds = (data.items || []).map((item: unknown, index: number) => 
              normalizeMenuItemData(item as Partial<NestedMenuItem> | LegacyMenuItem, index)
            );

            return {
              ...data,
              docId: doc.id,
              items: itemsWithFrontendIds,
              isEditing: false,
            };
          }) as Category[];

          // Sort categories by order field to ensure proper ordering
          fetchedCategories.sort((a, b) => (a.order || 0) - (b.order || 0));

          setCategories(fetchedCategories);
        }
      } catch (error) {
        setError("Failed to load menu data. Please try again.");
        toast.error("Failed to load menu data");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantId, setCategories]);

  const migrateMenuData = useMemo(() => async (): Promise<{ success: boolean; message: string }> => {
    try {
      await migrateRestaurantMenuData(restaurantId);
      return { success: true, message: "Menu data migrated successfully" };
    } catch (error) {
      return { success: false, message: "Failed to migrate menu data" };
    }
  }, [restaurantId]);

  const toggleItemAvailability = useCallback((itemId: string) => {
    const categoryIndex = categories.findIndex(cat => 
      cat.items.some(item => item.id === itemId || item.frontendId === itemId)
    );
    
    if (categoryIndex !== -1) {
      const itemIndex = categories[categoryIndex].items.findIndex(
        item => item.id === itemId || item.frontendId === itemId
      );
      
      if (itemIndex !== -1) {
        const newCategories = [...categories];
        const item = newCategories[categoryIndex].items[itemIndex];
        item.isAvailable = !item.isAvailable;
        setCategories(newCategories);
      }
    }
  }, [categories]);

  return {
    categories,
    setCategories,
    loading,
    loadingExtras,
    error,
    confirmDialog,
    reusableExtras,
    setError,
    setConfirmDialog,
    handleAddCategory,
    handleAddItem,
    toggleEditCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleDeleteItem,
    updateItemCustomizations,
    handleCategoryChange,
    handleItemChange,
    addReusableExtraGroup,
    updateReusableExtraGroup,
    deleteReusableExtraGroup,
    updateItemLinkedExtras,
    migrateMenuData,
    toggleItemAvailability,
    reorderCategories,
    saveCategoryOrder,
  };
}
