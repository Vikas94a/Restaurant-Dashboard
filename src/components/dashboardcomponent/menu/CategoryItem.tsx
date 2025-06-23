"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<NestedMenuItem | null>(null);

  const handleCategoryClick = useCallback(() => {
    if (!category.isEditing) {
      setIsExpanded((prev) => !prev);
    }
  }, [category.isEditing]);

  useEffect(() => {
    if (category.isEditing) {
      setIsExpanded(true);
    }
  }, [category.isEditing]);

  return (
    <>
      <div className="block w-160 max-w-full min-w-0 mb-4 bg-white rounded-md shadow transition-all duration-300 hover:shadow-md border border-gray-200">
        <CategoryHeader
          category={category}
          catIndex={catIndex}
          loading={loading}
          handleCategoryChange={handleCategoryChange}
          toggleEditCategory={toggleEditCategory}
          handleSaveCategory={handleSaveCategory}
          handleDeleteCategory={handleDeleteCategory}
          handleCategoryClick={handleCategoryClick}
          isExpanded={isExpanded}
        />

        {/* Expandable content area */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-3 border-t border-gray-200 bg-gray-50">
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
              toggleEditCategory={toggleEditCategory}
              handleSaveCategory={handleSaveCategory}
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
