import { useState } from 'react';
import { Category } from '@/utils/menuTypes';
import { fetchMenuData, saveCategory, deleteCategory } from '@/utils/menu/firestore';
import { toast } from 'sonner';

export function useCategories(restaurantId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchMenuData(restaurantId);
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (index: number, field: 'categoryName' | 'categoryDescription', value: string) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, [field]: value } : cat
    ));
  };

  const handleAddCategory = () => {
    setCategories(prev => [...prev, {
      categoryName: '',
      categoryDescription: '',
      items: [],
      isEditing: true,
    }]);
  };

  const handleSaveCategory = async (index: number) => {
    const category = categories[index];
    if (!category.categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const docId = await saveCategory(restaurantId, category);
      setCategories(prev => prev.map((cat, i) => 
        i === index ? { ...cat, docId, isEditing: false } : cat
      ));
      toast.success('Category saved successfully');
    } catch {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (index: number) => {
    const category = categories[index];
    if (!category.docId) {
      setCategories(prev => prev.filter((_, i) => i !== index));
      return;
    }

    try {
      await deleteCategory(restaurantId, category.docId);
      setCategories(prev => prev.filter((_, i) => i !== index));
      toast.success('Category deleted successfully');
    } catch {
      toast.error('Failed to delete category');
    }
  };

  return {
    categories,
    loading,
    loadCategories,
    handleCategoryChange,
    handleAddCategory,
    handleSaveCategory,
    handleDeleteCategory,
    setCategories,
  };
} 