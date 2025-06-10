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
  choices: ReusableExtraChoice[];
  isArchived?: boolean;
}

// Legacy format interfaces (for migration)
export interface LegacyMenuItem {
  itemName?: string;
  itemDescription?: string;
  itemPrice?: number;
  [key: string]: any;
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
