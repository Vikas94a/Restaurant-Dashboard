/**
 * Common interfaces for menu data structures
 * This centralizes the menu data types for consistent usage across components
 */

// Base interface for menu item properties
export interface BaseMenuItem {
  id: string;
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  isAvailable: boolean;
}

// Interface for menu item customization choices
export interface CustomizationChoice {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
  isEditing?: boolean;
}

// Interface for customization groups
export interface CustomizationGroup {
  id: string;
  groupName: string;
  selectionType: 'single' | 'multiple';
  required?: boolean;
  choices: CustomizationChoice[];
}

// Extended menu item with all optional properties
export interface NestedMenuItem extends BaseMenuItem {
  frontendId?: string;
  imageUrl?: string;
  category?: string;
  isPopular?: boolean;
  dietaryTags?: string[];
  customizations?: CustomizationGroup[];
  linkedReusableExtras?: { [groupId: string]: string[] };
  linkedReusableExtraIds?: string[];
  subItems?: NestedMenuItem[];
  itemType?: 'item' | 'modifier';
  isEditing?: boolean;
}

// Menu category containing multiple items
export interface Category {
  docId?: string;
  frontendId?: string;
  categoryName: string;
  categoryDescription?: string;
  items: NestedMenuItem[];
  order?: number;
  isEditing?: boolean;
}

// Reusable extras that can be linked to menu items
export interface ReusableExtraChoice {
  id: string;
  name: string;
  price: number;
}

// Group of reusable extras
export interface ReusableExtraGroup {
  id: string;
  groupName: string;
  selectionType: 'single' | 'multiple';
  required?: boolean; // Whether this group is required for items that use it
  choices: ReusableExtraChoice[];
  isArchived?: boolean;
}

// Legacy format interfaces (for migration)
export interface LegacyMenuItem {
  itemName?: string;
  itemDescription?: string;
  itemPrice?: number;
  [key: string]: string | number | boolean | undefined;
}

// Type for specific fields that can be changed in a menu item
export type ItemChangeField =
  | 'name'
  | 'description'
  | 'priceAmount'
  | 'priceCurrency'
  | 'isAvailable'
  | 'isPopular'
  | 'dietaryTags'
  | 'itemType'
  | 'imageUrl';

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

// Type guard functions
export function isMenuItem(data: unknown): data is NestedMenuItem {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'price' in data &&
    'isAvailable' in data
  );
}

export function isMenuCategory(data: unknown): data is Category {
  return (
    typeof data === 'object' &&
    data !== null &&
    'categoryName' in data &&
    'items' in data &&
    Array.isArray((data as Category).items)
  );
}

export function isCustomizationOption(data: unknown): data is CustomizationChoice {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'price' in data
  );
}

// Props interfaces
export interface MenuHeaderProps {
  restaurantName: string;
  onSearch: (query: string) => void;
}

export interface MenuItemProps {
  item: NestedMenuItem;
  onEdit: (item: NestedMenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string) => void;
}

export interface MenuCategoryProps {
  category: Category;
  onEditItem: (item: NestedMenuItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleItemAvailability: (id: string) => void;
}

export interface OrderItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

// Item type for menu editor
export interface Item {
  id?: string;
  frontendId?: string;
  name: string;
  description: string;
  price: { amount: number; currency: string };
  imageUrl?: string;
  category?: string;
  isAvailable?: boolean;
  isPopular?: boolean;
  dietaryTags?: string[];
  customizations?: CustomizationGroup[];
  linkedReusableExtras?: { [groupId: string]: string[] };
  linkedReusableExtraIds?: string[];
  subItems?: Item[];
  itemType?: 'item' | 'modifier';
  isEditing?: boolean;
}
