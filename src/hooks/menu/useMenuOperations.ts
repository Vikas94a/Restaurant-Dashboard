import { useCallback } from 'react';
import { doc, updateDoc, deleteDoc, addDoc, collection, getDoc } from 'firebase/firestore';
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

interface FirestoreItem {
  name: string;
  description?: string;
  price: {
    amount: number;
    currency: string;
  };
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  isPopular: boolean;
  dietaryTags: string[];
  customizations: unknown[];
  linkedReusableExtras: Record<string, unknown>;
  linkedReusableExtraIds: string[];
  subItems: unknown[];
  itemType: 'item' | 'modifier';
}

export const useMenuOperations = ({
  restaurantId,
  setError,
  setLoading,
  setConfirmDialog,
}: UseMenuOperationsProps) => {
  const cleanItemForFirestore = useCallback((item: NestedMenuItem): FirestoreItem => {
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
          items: itemsForFirestore,
          order: categoryIndex // Add order field for new categories
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
            
            // Fetch the current category document to get the exact item structure from Firestore
            const categoryDoc = await getDoc(categoryRef);
            if (!categoryDoc.exists()) {
              throw new Error('Category not found');
            }

            const categoryData = categoryDoc.data();
            const currentItems = categoryData.items || [];
            
            // Helper function to compare two items for equality
            const itemsMatch = (item1: any, item2: any): boolean => {
              // First, try matching by id if both have it
              if (item1.id && item2.id && item1.id === item2.id) {
                return true;
              }
              
              // Otherwise, compare key fields that should be unique
              return item1.name === item2.name &&
                     (item1.description || '') === (item2.description || '') &&
                     (item1.price?.amount ?? 0) === (item2.price?.amount ?? 0) &&
                     (item1.price?.currency || 'USD') === (item2.price?.currency || 'USD');
            };
            
            // Find the item index in the Firestore array
            const itemIndexToRemove = currentItems.findIndex((firestoreItem: any) => {
              return itemsMatch(firestoreItem, item);
            });
            
            if (itemIndexToRemove === -1) {
              // If we can't find an exact match, try with cleaned item
              const cleanedItem = cleanItemForFirestore(item);
              const cleanedItemIndex = currentItems.findIndex((firestoreItem: any) => {
                return itemsMatch(firestoreItem, cleanedItem);
              });
              
              if (cleanedItemIndex === -1) {
                throw new Error('Item not found in Firestore. It may have already been deleted.');
              }
              
              // Remove the item at the found index
              const updatedItems = [...currentItems];
              updatedItems.splice(cleanedItemIndex, 1);
              
              await updateDoc(categoryRef, {
                items: updatedItems
              });
            } else {
              // Remove the item at the found index
              const updatedItems = [...currentItems];
              updatedItems.splice(itemIndexToRemove, 1);
              
              await updateDoc(categoryRef, {
                items: updatedItems
              });
            }
          }

          const updatedCategories = [...categories];
          updatedCategories[categoryIndex].items.splice(itemIndex, 1);
          setCategories(updatedCategories);

          toast.success("Item deleted successfully");
        } catch (error) {
          const errorMessage = getMenuEditorErrorMessage(error);
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }, [restaurantId, cleanItemForFirestore, setError, setLoading, setConfirmDialog]);

  const saveCategoryOrder = useCallback(async (
    categories: Category[]
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Update each category with its new order
      const updatePromises = categories.map((category, index) => {
        if (category.docId) {
          const categoryRef = doc(db, "restaurants", restaurantId, "menu", category.docId);
          return updateDoc(categoryRef, {
            order: index
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      toast.success("Category order saved successfully");
    } catch (error) {
      const errorMessage = getMenuEditorErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, setError, setLoading]);

  return {
    cleanItemForFirestore,
    handleSaveCategory,
    handleDeleteCategory,
    handleDeleteItem,
    saveCategoryOrder,
  };
}; 