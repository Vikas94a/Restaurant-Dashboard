import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { menuService, FrontendMenuItem, FrontendCategory, NestedMenuItem } from '@/services/menuService';
import { toast } from 'sonner';

interface MenuError {
  message?: string;
}

export interface MenuState {
  categories: FrontendCategory[];
  items: FrontendMenuItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  selectedCategory: string | null;
  editingCategoryId: string | null; // Track which category is being edited
}

const initialState: MenuState = {
  categories: [],
  items: [],
  status: 'idle',
  error: null,
  selectedCategory: null,
  editingCategoryId: null
};

// Async thunks
export const fetchMenuData = createAsyncThunk(
  'menu/fetchData',
  async (restaurantId: string, { rejectWithValue }) => {
    try {
      const [categories, items] = await Promise.all([
        menuService.getCategories(restaurantId),
        menuService.getMenuItems(restaurantId)
      ]);
      return { categories, items };
    } catch (error) {
      const menuError = error as MenuError;
      return rejectWithValue(menuError.message || 'Failed to fetch menu data');
    }
  }
);

export const addMenuItem = createAsyncThunk(
  'menu/addItem',
  async ({ restaurantId, categoryId, menuItem }: { 
    restaurantId: string; 
    categoryId: string; 
    menuItem: NestedMenuItem 
  }, { rejectWithValue }) => {
    try {
      await menuService.addMenuItem(restaurantId, categoryId, menuItem);
      return { categoryId, menuItem };
    } catch (error) {
      const menuError = error as MenuError;
      return rejectWithValue(menuError.message || 'Failed to add menu item');
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'menu/updateItem',
  async ({ restaurantId, categoryId, oldMenuItem, newMenuItem }: {
    restaurantId: string;
    categoryId: string;
    oldMenuItem: NestedMenuItem;
    newMenuItem: NestedMenuItem;
  }, { rejectWithValue }) => {
    try {
      await menuService.updateMenuItem(restaurantId, categoryId, oldMenuItem, newMenuItem);
      return { categoryId, oldMenuItem, newMenuItem };
    } catch (error) {
      const menuError = error as MenuError;
      return rejectWithValue(menuError.message || 'Failed to update menu item');
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'menu/deleteItem',
  async ({ restaurantId, categoryId, menuItem }: {
    restaurantId: string;
    categoryId: string;
    menuItem: NestedMenuItem;
  }, { rejectWithValue }) => {
    try {
      await menuService.deleteMenuItem(restaurantId, categoryId, menuItem);
      return { categoryId, menuItem };
    } catch (error) {
      const menuError = error as MenuError;
      return rejectWithValue(menuError.message || 'Failed to delete menu item');
    }
  }
);

export const addCategory = createAsyncThunk(
  'menu/addCategory',
  async ({ restaurantId, category }: {
    restaurantId: string;
    category: Omit<FrontendCategory, 'id'>;
  }, { rejectWithValue }) => {
    try {
      const categoryId = await menuService.addCategory(restaurantId, category);
      return { ...category, id: categoryId };
    } catch (error) {
      const menuError = error as MenuError;
      return rejectWithValue(menuError.message || 'Failed to add category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'menu/updateCategory',
  async ({ restaurantId, categoryId, updates }: {
    restaurantId: string;
    categoryId: string;
    updates: Partial<Omit<FrontendCategory, 'id'>>;
  }, { rejectWithValue }) => {
    try {
      await menuService.updateCategory(restaurantId, categoryId, updates);
      return { categoryId, updates };
    } catch (error) {
      const menuError = error as MenuError;
      return rejectWithValue(menuError.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'menu/deleteCategory',
  async ({ restaurantId, categoryId }: {
    restaurantId: string;
    categoryId: string;
  }, { rejectWithValue }) => {
    try {
      await menuService.deleteCategory(restaurantId, categoryId);
      return categoryId;
    } catch (error) {
      const menuError = error as MenuError;
      return rejectWithValue(menuError.message || 'Failed to delete category');
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    clearMenuError: (state) => {
      state.error = null;
    },
    setEditingCategory: (state, action: PayloadAction<string | null>) => {
      state.editingCategoryId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Menu Data
      .addCase(fetchMenuData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMenuData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload.categories;
        state.items = action.payload.items;
      })
      .addCase(fetchMenuData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      // Add Menu Item
      .addCase(addMenuItem.fulfilled, (state, action) => {
        const { categoryId, menuItem } = action.payload;
        const newItem: FrontendMenuItem = {
          ...menuItem,
          frontendId: `${categoryId}-${state.items.length}`,
          categoryId
        };
        state.items.push(newItem);
        toast.success('Menu item added successfully');
      })
      .addCase(addMenuItem.rejected, (state, action) => {
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      // Update Menu Item
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const { categoryId, oldMenuItem, newMenuItem } = action.payload;
        const index = state.items.findIndex(
          item => item.categoryId === categoryId && 
          item.itemName === oldMenuItem.itemName
        );
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...newMenuItem
          };
          toast.success('Menu item updated successfully');
        }
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      // Delete Menu Item
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        const { categoryId, menuItem } = action.payload;
        state.items = state.items.filter(
          item => !(item.categoryId === categoryId && item.itemName === menuItem.itemName)
        );
        toast.success('Menu item deleted successfully');
      })
      .addCase(deleteMenuItem.rejected, (state, action) => {
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      // Add Category
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        toast.success('Category added successfully');
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      // Update Category
      .addCase(updateCategory.fulfilled, (state, action) => {
        const { categoryId, updates } = action.payload;
        const category = state.categories.find(cat => cat.id === categoryId);
        if (category) {
          Object.assign(category, updates);
          toast.success('Category updated successfully');
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      // Delete Category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        const categoryId = action.payload;
        state.categories = state.categories.filter(cat => cat.id !== categoryId);
        state.items = state.items.filter(item => item.categoryId !== categoryId);
        if (state.selectedCategory === categoryId) {
          state.selectedCategory = null;
        }
        toast.success('Category deleted successfully');
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  }
});

export const { setSelectedCategory, clearMenuError, setEditingCategory } = menuSlice.actions;
export default menuSlice.reducer; 