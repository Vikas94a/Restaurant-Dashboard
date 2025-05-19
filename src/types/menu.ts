export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
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
  itemName: string;
  itemDescription: string;
  itemPrice: number;
}

export interface Category {
  categoryName: string;
  categoryDescription: string;
  items: Item[];
  isEditing?: boolean;
  docId?: string;
} 