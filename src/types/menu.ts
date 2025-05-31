export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  available: boolean;
  customizations?: MenuItemCustomization[];
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  required: boolean;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

export interface MenuData {
  categories: MenuCategory[];
  restaurantId: string;
}

// Type guard functions
export function isMenuItem(data: unknown): data is MenuItem {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'price' in data &&
    'category' in data &&
    'available' in data
  );
}

export function isMenuCategory(data: unknown): data is MenuCategory {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'items' in data &&
    Array.isArray((data as MenuCategory).items)
  );
}

export function isCustomizationOption(data: unknown): data is CustomizationOption {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'price' in data
  );
}

export interface MenuHeaderProps {
  restaurantName: string;
  onSearch: (query: string) => void;
}

export interface MenuItemProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string) => void;
}

export interface MenuCategoryProps {
  category: MenuCategory;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleItemAvailability: (id: string) => void;
}

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

export interface Category {
  docId?: string;
  frontendId?: string;
  categoryName: string;
  categoryDescription?: string;
  items: Item[];
  isEditing?: boolean;
}

export interface CustomizationChoice {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
  isEditing?: boolean;
}

export interface CustomizationGroup {
  id: string;
  groupName: string;
  selectionType: 'single' | 'multiple';
  required?: boolean;
  choices: CustomizationChoice[];
}

export interface ReusableExtraChoice {
  id: string;
  name: string;
  price: number;
}

export interface ReusableExtraGroup {
  id: string;
  groupName: string;
  selectionType: 'single' | 'multiple';
  choices: ReusableExtraChoice[];
}

export type ItemChangeField =
  | 'name'
  | 'description'
  | 'priceAmount'
  | 'priceCurrency'
  | 'isAvailable'
  | 'isPopular'
  | 'dietaryTags'
  | 'itemType';

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