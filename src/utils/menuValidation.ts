import { Category, NestedMenuItem, CustomizationGroup, CustomizationChoice } from './menuTypes';

/**
 * Validates a menu item to ensure it has all required fields
 * @param item Menu item to validate
 * @returns Object with validation result and error message if invalid
 */
export const validateMenuItem = (item: Partial<NestedMenuItem>): { isValid: boolean; message?: string } => {
  if (!item.name || item.name.trim() === '') {
    return { isValid: false, message: 'Item name is required' };
  }

  if (item.price === undefined || item.price.amount < 0) {
    return { isValid: false, message: 'Item price must be a non-negative number' };
  }

  return { isValid: true };
};

/**
 * Validates a category to ensure it has all required fields
 * @param category Category to validate
 * @returns Object with validation result and error message if invalid
 */
export const validateCategory = (category: Partial<Category>): { isValid: boolean; message?: string } => {
  if (!category.categoryName || category.categoryName.trim() === '') {
    return { isValid: false, message: 'Category name is required' };
  }

  return { isValid: true };
};

/**
 * Validates a customization group to ensure it has all required fields
 * @param group Customization group to validate
 * @returns Object with validation result and error message if invalid
 */
export const validateCustomizationGroup = (group: Partial<CustomizationGroup>): { isValid: boolean; message?: string } => {
  if (!group.groupName || group.groupName.trim() === '') {
    return { isValid: false, message: 'Group name is required' };
  }

  if (!group.selectionType) {
    return { isValid: false, message: 'Selection type is required' };
  }

  if (!group.choices || group.choices.length === 0) {
    return { isValid: false, message: 'At least one choice is required' };
  }

  // Check if all choices are valid
  const invalidChoice = group.choices.find(choice => !choice.name || choice.name.trim() === '');
  if (invalidChoice) {
    return { isValid: false, message: 'All choices must have a name' };
  }

  return { isValid: true };
};

/**
 * Validates a customization choice to ensure it has all required fields
 * @param choice Customization choice to validate
 * @returns Object with validation result and error message if invalid
 */
export const validateCustomizationChoice = (choice: Partial<CustomizationChoice>): { isValid: boolean; message?: string } => {
  if (!choice.name || choice.name.trim() === '') {
    return { isValid: false, message: 'Choice name is required' };
  }

  if (choice.price === undefined) {
    return { isValid: false, message: 'Choice price is required' };
  }

  return { isValid: true };
};
