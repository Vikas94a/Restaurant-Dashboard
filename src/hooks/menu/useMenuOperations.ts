import { useCallback } from 'react';
import { doc, updateDoc, deleteDoc, arrayRemove, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Category, NestedMenuItem } from '@/utils/menuTypes';
import { getMenuEditorErrorMessage } from '@/utils/menu/errorHandling';

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface UseMenuOperationsProps {
  restaurantId: string;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialog>>;
}

export const useMenuOperations = ({
  restaurantId,
  setError,
  setLoading,
  setConfirmDialog,
}: UseMenuOperationsProps) => {
  const cleanItemForFirestore = useCallback((item: NestedMenuItem): any => {
    return {
      name: item.name,
      description: item.description,
      price: {
        amount: item.price?.amount ?? 0,
        currency: item.price?.currency ?? 'USD',
      },
      imageUrl: item.imageUrl ?? '',
      category: item.category ?? '',
      isAvailable: item.isAvailable ?? true,
      isPopular: item.isPopular ?? false,
      dietaryTags: item.dietaryTags ?? [],
      customizations: item.customizations ?? [],
      linkedReusableExtras: item.linkedReusableExtras ?? {},
      linkedReusableExtraIds: item.linkedReusableExtraIds ?? [],
      subItems: item.subItems ?? [],
      itemType: item.itemType ?? 'item',
    };
  }, []);

  const handleSaveCategory = useCallback(async (
    category: Category,
    categoryIndex: number,
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  ): Promise<void> => {
    if (!category.categoryName?.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemsForFirestore = category.items.map(cleanItemForFirestore);

      if (category.docId) {
        const categoryRef = doc(db, "restaurants", restaurantId, "menu", category.docId);
        await updateDoc(categoryRef, {
          categoryName: category.categoryName,
          categoryDescription: category.categoryDescription || "",
          items: itemsForFirestore
        });

        toast.success("Category updated successfully");
      } else {
        const categoryData = {
          categoryName: category.categoryName,
          categoryDescription: category.categoryDescription || "",
          items: itemsForFirestore
        };

        const docRef = await addDoc(collection(db, "restaurants", restaurantId, "menu"), categoryData);

        setCategories(prevCategories => {
          const newCategories = [...prevCategories];
          newCategories[categoryIndex] = {
            ...newCategories[categoryIndex],
            docId: docRef.id,
            isEditing: false
          };
          return newCategories;
        });

        toast.success("Category added successfully");
      }
    } catch (error) {
      console.error("[MenuEditor] Error saving category:", error);
      const errorMessage = getMenuEditorErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, cleanItemForFirestore, setError, setLoading]);

  const handleDeleteCategory = useCallback(async (
    category: Category,
    categoryIndex: number,
    categories: Category[],
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  ): Promise<void> => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.categoryName || 'Unnamed Category'}" and all its items? This action cannot be undone.`,
      onConfirm: async () => {
        setLoading(true);
        setError(null);

        try {
          if (category.docId) {
            await deleteDoc(doc(db, "restaurants", restaurantId, "menu", category.docId));
          }

          const updatedCategories = [...categories];
          updatedCategories.splice(categoryIndex, 1);
          setCategories(updatedCategories);

          toast.success("Category deleted successfully");
        } catch (error) {
          console.error("[MenuEditor] Error deleting category:", error);
          const errorMessage = getMenuEditorErrorMessage(error);
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }, [restaurantId, setError, setLoading, setConfirmDialog]);

  const handleDeleteItem = useCallback(async (
    category: Category,
    item: NestedMenuItem,
    categoryIndex: number,
    itemIndex: number,
    categories: Category[],
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  ): Promise<void> => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Item",
      message: `Are you sure you want to delete "${item.name || 'Unnamed Item'}"? This action cannot be undone.`,
      onConfirm: async () => {
        setLoading(true);
        setError(null);

        try {
          if (category.docId) {
            const categoryRef = doc(db, "restaurants", restaurantId, "menu", category.docId);
            const { id, ...itemWithoutFrontendId } = item;
            await updateDoc(categoryRef, {
              items: arrayRemove(itemWithoutFrontendId)
            });
          }

          const updatedCategories = [...categories];
          updatedCategories[categoryIndex].items.splice(itemIndex, 1);
          setCategories(updatedCategories);

          toast.success("Item deleted successfully");
        } catch (error) {
          console.error("[MenuEditor] Error deleting item:", error);
          const errorMessage = getMenuEditorErrorMessage(error);
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }, [restaurantId, setError, setLoading, setConfirmDialog]);

  return {
    cleanItemForFirestore,
    handleSaveCategory,
    handleDeleteCategory,
    handleDeleteItem,
  };
}; 