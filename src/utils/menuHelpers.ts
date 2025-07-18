import { Category, NestedMenuItem } from '@/utils/menuTypes';

// Helper to find category index by ID
export const findCategoryIndex = (categories: Category[], categoryId: string): number => {
  return categories.findIndex(
    cat => cat.docId === categoryId || cat.frontendId === categoryId
  );
};

// Helper to find item index by ID
export const findItemIndex = (category: Category, itemId: string): number => {
  return category.items.findIndex(
    item => item.id === itemId || item.frontendId === itemId
  );
};

// Helper to get category ID (either docId or frontendId)
export const getCategoryId = (category: Category): string | undefined => {
  return category.docId || category.frontendId;
};

// Helper to get valid item ID
export const getItemId = (item: NestedMenuItem): string => {
  return item.id || item.frontendId || '';
};

// Helper to validate category and item IDs
export const validateIds = (categoryId: string, itemId: string): boolean => {
  if (!categoryId || !itemId) {
    return false;
  }
  return true;
}; 