import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Category, NestedMenuItem, CustomizationGroup, ItemChangeField } from '@/utils/menuTypes';
import { useMenuOperations } from './useMenuOperations';

interface UseMenuItemOperationsProps {
  restaurantId: string;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>>;
}

export const useMenuItemOperations = ({
  restaurantId,
  categories,
  setCategories,
  setError,
  setLoading,
  setConfirmDialog,
}: UseMenuItemOperationsProps) => {
  const { cleanItemForFirestore, handleDeleteItem: deleteItem } = useMenuOperations({
    restaurantId,
    setError,
    setLoading,
    setConfirmDialog,
  });

  const handleAddItem = useCallback(async (catIndex: number) => {
    const updatedCategories = [...categories];
    const newItem: NestedMenuItem = {
      id: `new-item-${Date.now()}-${catIndex}`,
      name: "",
      description: "",
      price: { amount: 0, currency: "USD" },
      isAvailable: true,
      isEditing: true
    };

    updatedCategories[catIndex].items.push(newItem);
    setCategories(updatedCategories);

    // Don't save to database until item is properly filled
    // The item will be saved when the category is saved
  }, [categories, setCategories]);

  const handleItemChange = useCallback((
    catIndex: number,
    itemIndex: number,
    field: ItemChangeField,
    value: string | number | boolean | string[]
  ) => {
    setCategories(prevCategories => {
      const newCategories = [...prevCategories];
      if (catIndex >= 0 && catIndex < newCategories.length &&
        itemIndex >= 0 && itemIndex < newCategories[catIndex].items.length) {
        const itemToUpdate = { ...newCategories[catIndex].items[itemIndex] };

        if (field === 'priceAmount') {
          itemToUpdate.price = {
            ...(itemToUpdate.price || { currency: 'USD' }),
            amount: Number(value)
          };
        } else if (field === 'priceCurrency') {
          itemToUpdate.price = {
            ...(itemToUpdate.price || { amount: 0 }),
            currency: String(value)
          };
        } else if (field === 'name') {
          itemToUpdate.name = String(value);
        } else if (field === 'description') {
          itemToUpdate.description = String(value);
        } else if (field === 'isAvailable' || field === 'isPopular') {
          itemToUpdate[field] = Boolean(value);
        } else if (field === 'itemType') {
          itemToUpdate.itemType = value === 'item' || value === 'modifier' ? value : 'item';
        } else if (field === 'dietaryTags') {
          itemToUpdate.dietaryTags = Array.isArray(value)
            ? value.map(String)
            : typeof value === 'string'
              ? value.split(',').map(tag => tag.trim()).filter(tag => tag)
              : [];
        }

        // Check if the item is empty (no name, description, or price)
        const isEmpty = !itemToUpdate.name?.trim() && 
                       !itemToUpdate.description?.trim() && 
                       (!itemToUpdate.price?.amount || itemToUpdate.price.amount === 0);

        if (isEmpty) {
          // Remove the empty item
          newCategories[catIndex].items.splice(itemIndex, 1);
        } else {
          newCategories[catIndex].items[itemIndex] = itemToUpdate;
        }
      }
      return newCategories;
    });
  }, []);

  const updateItemCustomizations = useCallback((itemFrontendId: string | undefined, newCustomizations: CustomizationGroup[]) => {
    if (!itemFrontendId) {
      toast.error("Item ID is missing, cannot update customizations.");
      return;
    }

    setCategories(prevCategories =>
      prevCategories.map(category => ({
        ...category,
        items: category.items.map(item =>
          item.id === itemFrontendId
            ? { ...item, customizations: newCustomizations }
            : item
        )
      }))
    );
    toast.success('Item customizations updated locally.');
  }, []);

  const updateItemLinkedExtras = useCallback(async (itemFrontendId: string | undefined, linkedExtraGroupIds: string[]): Promise<void> => {
    if (!itemFrontendId) {
      toast.error("Item ID is missing, cannot update linked extras.");
      return;
    }

    setCategories(prevCategories =>
      prevCategories.map(category => ({
        ...category,
        items: category.items.map(item =>
          item.id === itemFrontendId
            ? { ...item, linkedReusableExtraIds: linkedExtraGroupIds }
            : item
        )
      }))
    );
  }, []);

  const handleDeleteItem = useCallback(async (categoryIndex: number, itemIndex: number) => {
    const category = categories[categoryIndex];
    const item = category.items[itemIndex];
    if (!category || !item) return;
    await deleteItem(category, item, categoryIndex, itemIndex, categories, setCategories);
  }, [categories, deleteItem]);

  return {
    handleAddItem,
    handleItemChange,
    handleDeleteItem,
    updateItemCustomizations,
    updateItemLinkedExtras,
  };
}; 