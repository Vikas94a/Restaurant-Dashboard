"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '@/utils/menuTypes';
import { normalizeMenuItemData } from '@/utils/firebase/menu';
import { useMenuCategoryOperations } from './menu/useMenuCategoryOperations';
import { useMenuItemOperations } from './menu/useMenuItemOperations';
import { useReusableExtraOperations } from './menu/useReusableExtraOperations';
import { migrateRestaurantMenuData } from '@/utils/firebase/menu';

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

// Helper function to get user-friendly error message
const getMenuEditorErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = error.code as keyof typeof MENU_EDITOR_ERROR_MESSAGES;
    return MENU_EDITOR_ERROR_MESSAGES[code] || MENU_EDITOR_ERROR_MESSAGES.default;
  }
  return MENU_EDITOR_ERROR_MESSAGES.default;
};

export interface MenuEditorResult {
  categories: Category[];
  loading: boolean;
  loadingExtras: boolean;
  error: string | null;
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  };
  reusableExtras: any[];
  setError: (error: string | null) => void;
  setConfirmDialog: (dialog: any) => void;
  handleAddCategory: () => void;
  handleAddItem: (categoryIndex: number) => Promise<void>;
  toggleEditCategory: (categoryIndex: number) => void;
  handleSaveCategory: (categoryIndex: number) => Promise<void>;
  handleDeleteCategory: (categoryIndex: number) => Promise<void>;
  handleDeleteItem: (categoryIndex: number, itemIndex: number) => Promise<void>;
  updateItemCustomizations: (itemId: string, customizations: any[]) => void;
  handleCategoryChange: (categoryIndex: number, field: keyof Pick<Category, 'categoryName' | 'categoryDescription'>, value: string) => void;
  handleItemChange: (categoryIndex: number, itemIndex: number, field: any, value: any) => void;
  addReusableExtraGroup: (groupData: any) => Promise<string | null>;
  updateReusableExtraGroup: (groupId: string, groupData: any) => Promise<void>;
  deleteReusableExtraGroup: (groupId: string) => Promise<void>;
  updateItemLinkedExtras: (itemId: string, groupIds: string[]) => Promise<void>;
  migrateMenuData: () => Promise<{ success: boolean; message: string }>;
}

export function useMenuEditor(restaurantId: string): MenuEditorResult {
  // State hooks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
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
    setError,
    setLoading,
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
        const querySnapshot = await getDocs(menuRef);

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
            const itemsWithFrontendIds = (data.items || []).map((item: any, index: number) => 
              normalizeMenuItemData(item, index)
            );

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
        setError("Failed to load menu data. Please try again.");
        toast.error("Failed to load menu data");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantId, setCategories]);

  const migrateMenuData = async (): Promise<{ success: boolean; message: string }> => {
    if (!restaurantId) {
      return { success: false, message: 'Restaurant ID is required' };
    }
    
    try {
      setLoading(true);
      const result = await migrateRestaurantMenuData(restaurantId);
      
      // If migration successful, refresh the menu data
      if (result.success) {
        const menuRef = collection(db, "restaurants", restaurantId, "menu");
        const querySnapshot = await getDocs(menuRef);
        const fetchedCategories = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const itemsWithFrontendIds = (data.items || []).map((item: any, index: number) => 
            normalizeMenuItemData(item, index)
          );

          return {
            ...data,
            docId: doc.id,
            items: itemsWithFrontendIds,
            isEditing: false,
          };
        }) as Category[];

        setCategories(fetchedCategories);
      }
      
      return result;
    } catch (error) {
      console.error('Error migrating menu data:', error);
      return { 
        success: false, 
        message: `Failed to migrate menu data: ${(error as Error).message}` 
      };
    } finally {
      setLoading(false);
    }
  };

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    categories,
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
  }), [
    categories,
    loading,
    loadingExtras,
    error,
    confirmDialog,
    reusableExtras,
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
  ]);
}
