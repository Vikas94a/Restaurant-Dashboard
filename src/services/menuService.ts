import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
}

export const menuService = {
  // Get all menu items for a restaurant
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
    const snapshot = await getDocs(menuRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem));
  },

  // Get all categories for a restaurant
  async getCategories(restaurantId: string): Promise<Category[]> {
    const categoriesRef = collection(db, 'restaurants', restaurantId, 'categories');
    const snapshot = await getDocs(categoriesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
  },

  // Add a new menu item
  async addMenuItem(restaurantId: string, menuItem: Omit<MenuItem, 'id'>): Promise<string> {
    const menuRef = collection(db, 'restaurants', restaurantId, 'menu');
    const docRef = await addDoc(menuRef, menuItem);
    return docRef.id;
  },

  // Update a menu item
  async updateMenuItem(restaurantId: string, menuItemId: string, updates: Partial<MenuItem>): Promise<void> {
    const menuItemRef = doc(db, 'restaurants', restaurantId, 'menu', menuItemId);
    await updateDoc(menuItemRef, updates);
  },

  // Delete a menu item
  async deleteMenuItem(restaurantId: string, menuItemId: string): Promise<void> {
    const menuItemRef = doc(db, 'restaurants', restaurantId, 'menu', menuItemId);
    await deleteDoc(menuItemRef);
  },

  // Add a new category
  async addCategory(restaurantId: string, category: Omit<Category, 'id'>): Promise<string> {
    const categoriesRef = collection(db, 'restaurants', restaurantId, 'categories');
    const docRef = await addDoc(categoriesRef, category);
    return docRef.id;
  },

  // Update a category
  async updateCategory(restaurantId: string, categoryId: string, updates: Partial<Category>): Promise<void> {
    const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
    await updateDoc(categoryRef, updates);
  },

  // Delete a category
  async deleteCategory(restaurantId: string, categoryId: string): Promise<void> {
    const categoryRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
    await deleteDoc(categoryRef);
  }
}; 