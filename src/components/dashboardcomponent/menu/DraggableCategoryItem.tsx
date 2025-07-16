"use client";

import React from "react";
import {
  useSortable,
} from "@dnd-kit/sortable";
import {
  CSS,
} from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/free-solid-svg-icons";
import CategoryItem from "./CategoryItem";
import { Category, NestedMenuItem, CustomizationGroup, ReusableExtraGroup, ItemChangeField } from "@/utils/menuTypes";

interface DraggableCategoryItemProps {
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

export default function DraggableCategoryItem({
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
}: DraggableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.docId || category.frontendId || `category-${catIndex}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-4 left-2 z-10 cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        title="Drag to reorder"
      >
        <FontAwesomeIcon icon={faGripVertical} className="w-4 h-4" />
      </div>

      {/* Category Item with left padding to accommodate drag handle */}
      <div className="pl-10">
        <CategoryItem
          category={category}
          catIndex={catIndex}
          loading={loading}
          handleCategoryChange={handleCategoryChange}
          handleItemChange={handleItemChange}
          handleAddItem={handleAddItem}
          toggleEditCategory={toggleEditCategory}
          handleSaveCategory={handleSaveCategory}
          handleDeleteCategory={handleDeleteCategory}
          handleDeleteItem={handleDeleteItem}
          updateItemCustomizations={updateItemCustomizations}
          reusableExtras={reusableExtras}
          updateItemLinkedExtras={updateItemLinkedExtras}
        />
      </div>
    </div>
  );
} 