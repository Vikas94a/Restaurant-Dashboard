"use client";

import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setEditingCategory } from "@/store/features/menuSlice";
import {
  Category,
  NestedMenuItem,
  CustomizationGroup,
  ReusableExtraGroup,
  ItemChangeField,
} from "@/utils/menuTypes";
import ItemCustomizationModal from "./ItemCustomizationModal";
import CategoryHeader from './CategoryHeader';
import ItemList from './ItemList';

interface CategoryItemProps {
  category: Category;
  catIndex: number;
  loading: boolean;
  handleCategoryChange: (
    catIndex: number,
    field: keyof Pick<Category, "categoryName" | "categoryDescription">,
    value: string
  ) => void;
  handleItemChange: (
    catIndex: number,
    itemIndex: number,
    field: ItemChangeField,
    value: string | number | boolean | string[]
  ) => void;
  handleAddItem: (categoryId: string) => Promise<void>;
  toggleEditCategory: (categoryId: string) => void;
  handleSaveCategory: (categoryId: string) => Promise<void>;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
  handleDeleteItem: (categoryId: string, itemId: string) => Promise<void>;
  updateItemCustomizations: (
    categoryId: string,
    itemId: string,
    customizations: CustomizationGroup[]
  ) => void;
  reusableExtras: ReusableExtraGroup[];
  updateItemLinkedExtras: (
    categoryId: string,
    itemId: string,
    linkedExtras: { [key: string]: string[] }
  ) => Promise<void>;
}

export default function CategoryItem({
  category,
  catIndex,
  loading,
  handleCategoryChange,
  handleItemChange,
  handleAddItem,
  toggleEditCategory,
  handleSaveCategory,
  handleDeleteCategory,
  handleDeleteItem,
  updateItemCustomizations,
  reusableExtras,
  updateItemLinkedExtras,
}: CategoryItemProps) {
  // Local state for expansion and customization modal
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<NestedMenuItem | null>(null);
  
  const dispatch = useDispatch();
  const editingCategoryId = useSelector((state: RootState) => state.menu.editingCategoryId);
  const isEditing = editingCategoryId === (category.docId || category.frontendId);

  const handleCategoryClick = useCallback(() => {
    if (!isEditing) {
      setIsExpanded((prev) => !prev);
    }
  }, [isEditing]);

  // Handle toggling edit mode
  const handleToggleEdit = useCallback(() => {
    const categoryId = category.docId || category.frontendId;
    if (categoryId) {
      dispatch(setEditingCategory(isEditing ? null : categoryId));
      toggleEditCategory(categoryId);
    }
  }, [category.docId, category.frontendId, toggleEditCategory, dispatch, isEditing]);

  // Handle saving category
  const handleSave = useCallback(async () => {
    const categoryId = category.docId || category.frontendId;
    if (categoryId) {
      await handleSaveCategory(categoryId);
      dispatch(setEditingCategory(null));
    }
  }, [category.docId, category.frontendId, handleSaveCategory, dispatch]);

  useEffect(() => {
    if (isEditing) {
      setIsExpanded(true);
    }
    // Auto-edit new categories (those without docId)
    if (!category.docId && !category.categoryName && !isEditing) {
      const categoryId = category.frontendId;
      if (categoryId) {
        dispatch(setEditingCategory(categoryId));
      }
    }
  }, [isEditing, category.docId, category.categoryName, category.frontendId, dispatch]);

  return (
    <>
      <div 
        className="block w-full max-w-full mb-4 bg-white rounded-md shadow transition-all duration-300 hover:shadow-md border border-gray-200 relative z-10"
      >
        <CategoryHeader
          category={category}
          catIndex={catIndex}
          loading={loading}
          handleCategoryChange={handleCategoryChange}
          toggleEditCategory={handleToggleEdit}
          handleSaveCategory={handleSave}
          handleDeleteCategory={handleDeleteCategory}
          handleCategoryClick={handleCategoryClick}
          isExpanded={isExpanded}
        />

        {/* Expandable content area */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-visible relative ${
            isExpanded ? "max-h-none opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-3 border-t border-gray-200 bg-gray-50 relative z-0">
            <ItemList
              category={category}
              catIndex={catIndex}
              loading={loading}
              handleItemChange={handleItemChange}
              handleAddItem={handleAddItem}
              handleDeleteItem={handleDeleteItem}
              updateItemCustomizations={updateItemCustomizations}
              reusableExtras={reusableExtras}
              updateItemLinkedExtras={updateItemLinkedExtras}
              isExpanded={isExpanded}
              onOpenCustomizationModal={(item) => {
                setSelectedItemForCustomization(item);
                setIsCustomizationModalOpen(true);
              }}
              toggleEditCategory={handleToggleEdit}
              handleSaveCategory={handleSave}
            />
          </div>
        </div>
      </div>

      {selectedItemForCustomization && (
        <ItemCustomizationModal
          isOpen={isCustomizationModalOpen}
          onClose={() => {
            setSelectedItemForCustomization(null);
            setIsCustomizationModalOpen(false);
          }}
          item={selectedItemForCustomization}
          reusableExtras={reusableExtras}
          onSaveLinkedExtras={(itemIdFromModal, linkedGroupIds) => {
            const categoryId = category.docId || category.frontendId;
            const currentItemId = itemIdFromModal || selectedItemForCustomization?.id || selectedItemForCustomization?.frontendId;
            if (categoryId && currentItemId) {
              const transformedLinkedExtras = linkedGroupIds.reduce(
                (acc, groupId) => {
                  acc[groupId] = [];
                  return acc;
                },
                {} as { [key: string]: string[] }
              );
              updateItemLinkedExtras(categoryId, currentItemId, transformedLinkedExtras);
            }
            setSelectedItemForCustomization(null);
            setIsCustomizationModalOpen(false);
          }}
        />
      )}
    </>
  );
}
