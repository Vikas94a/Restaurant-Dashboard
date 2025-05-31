import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '@/utils/menuTypes';
import { useMenuOperations } from './useMenuOperations';

interface UseMenuCategoryOperationsProps {
  restaurantId: string;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>>;
}

export const useMenuCategoryOperations = ({
  restaurantId,
  setError,
  setLoading,
  setConfirmDialog,
}: UseMenuCategoryOperationsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { handleSaveCategory: saveCategory, handleDeleteCategory: deleteCategory } = useMenuOperations({
    restaurantId,
    setError,
    setLoading,
    setConfirmDialog,
  });

  const handleAddCategory = useCallback(() => {
    const newCategory: Category = {
      categoryName: "",
      categoryDescription: "",
      items: [],
      isEditing: true,
      frontendId: uuidv4()
    };
    setCategories(prev => [...prev, newCategory]);
  }, []);

  const toggleEditCategory = useCallback((categoryIndex: number) => {
    setCategories(prevCategories =>
      prevCategories.map((category, index) => {
        if (index === categoryIndex) {
          return { ...category, isEditing: !category.isEditing };
        }
        return category;
      })
    );
  }, []);

  const handleCategoryChange = useCallback((
    catIndex: number,
    field: keyof Pick<Category, 'categoryName' | 'categoryDescription'>,
    value: string
  ) => {
    setCategories(prevCategories => {
      const newCategories = [...prevCategories];
      if (catIndex >= 0 && catIndex < newCategories.length) {
        newCategories[catIndex] = {
          ...newCategories[catIndex],
          [field]: value
        };
      }
      return newCategories;
    });
  }, []);

  const handleSaveCategory = useCallback(async (categoryIndex: number) => {
    const category = categories[categoryIndex];
    if (!category) return;
    await saveCategory(category, categoryIndex, setCategories);
  }, [categories, saveCategory]);

  const handleDeleteCategory = useCallback(async (categoryIndex: number) => {
    const category = categories[categoryIndex];
    if (!category) return;
    await deleteCategory(category, categoryIndex, categories, setCategories);
  }, [categories, deleteCategory]);

  return {
    categories,
    setCategories,
    handleAddCategory,
    toggleEditCategory,
    handleCategoryChange,
    handleSaveCategory,
    handleDeleteCategory,
  };
}; 