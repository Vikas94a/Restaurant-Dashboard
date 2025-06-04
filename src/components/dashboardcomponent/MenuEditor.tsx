"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faPlus,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { LoadingSpinner } from "./LoadingSpinner";
import { useMenuEditor } from "@/hooks/useMenuEditor";
import { CustomizationGroup } from "@/utils/menuTypes";
import CategoryItem from "./menu/CategoryItem";
import ConfirmationDialog from "./menu/ConfirmationDialog";
import ReusableExtrasManager from "./menu/ReusableExtrasManager";
import { useState } from "react";
import { toast } from "sonner";
import ErrorBanner from "./menu/ErrorBanner";
import { findCategoryIndex, findItemIndex, getCategoryId, getItemId, validateIds } from "@/utils/menuHelpers";

interface MenuEditorProps {
  restaurantId: string;
}

export default function MenuEditor({ restaurantId }: MenuEditorProps) {
  const {
    categories,
    loading,
    confirmDialog,
    setConfirmDialog,
    handleAddCategory,
    handleAddItem,
    toggleEditCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleDeleteItem,
    updateItemCustomizations,
    handleCategoryChange,
    handleItemChange,
    reusableExtras,
    loadingExtras,
    addReusableExtraGroup,
    updateReusableExtraGroup,
    deleteReusableExtraGroup,
    updateItemLinkedExtras,
    error,
    setError,
  } = useMenuEditor(restaurantId);

  // Generic wrapper for category operations
  const withCategoryIndex = async (
    categoryId: string,
    operation: (categoryIndex: number) => void | Promise<void>
  ) => {
    const categoryIndex = findCategoryIndex(categories, categoryId);
    if (categoryIndex !== -1) {
      await operation(categoryIndex);
    }
  };

  // Generic wrapper for item operations
  const withItemIndex = async (
    categoryId: string,
    itemId: string,
    operation: (categoryIndex: number, itemIndex: number) => void | Promise<void>
  ) => {
    const categoryIndex = findCategoryIndex(categories, categoryId);
    if (categoryIndex !== -1) {
      const itemIndex = findItemIndex(categories[categoryIndex], itemId);
      if (itemIndex !== -1) {
        await operation(categoryIndex, itemIndex);
      }
    }
  };

  // Wrapper functions using the generic helpers
  const handleAddItemWrapper = async (categoryId: string) => {
    await withCategoryIndex(categoryId, handleAddItem);
  };

  const handleDeleteCategoryWrapper = async (categoryId: string) => {
    await withCategoryIndex(categoryId, handleDeleteCategory);
  };

  const handleDeleteItemWrapper = async (categoryId: string, itemId: string) => {
    await withItemIndex(categoryId, itemId, handleDeleteItem);
  };

  const toggleEditCategoryWrapper = (categoryId: string) => {
    const categoryIndex = findCategoryIndex(categories, categoryId);
    if (categoryIndex !== -1) {
      toggleEditCategory(categoryIndex);
    }
  };

  const handleSaveCategoryWrapper = async (categoryId: string) => {
    const categoryIndex = findCategoryIndex(categories, categoryId);
    if (categoryIndex !== -1) {
      await handleSaveCategory(categoryIndex);
    }
  };

  const updateItemCustomizationsWrapper = async (
    categoryId: string,
    itemId: string,
    customizations: CustomizationGroup[]
  ) => {
    if (!validateIds(categoryId, itemId)) return;
    const item = categories[findCategoryIndex(categories, categoryId)]?.items.find(
      item => item.id === itemId
    );
    if (item) {
      updateItemCustomizations(item.id, customizations);
    }
  };

  const updateItemLinkedExtrasWrapper = async (
    categoryId: string,
    itemId: string,
    linkedExtras: { [key: string]: string[] }
  ) => {
    if (!validateIds(categoryId, itemId)) return;
    const item = categories[findCategoryIndex(categories, categoryId)]?.items.find(
      item => item.id === itemId
    );
    if (item) {
      const linkedGroupIds = Object.keys(linkedExtras);
      await updateItemLinkedExtras(item.id, linkedGroupIds);
    }
  };

  return (
    <div className="p-3 max-w-full">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      
      <div className="flex gap-2">
        <div className="flex-1 w-160 ">
          <MenuHeader
            onAddCategory={handleAddCategory}
            restaurantId={restaurantId}
          />
          <div className="flex-1 overflow-y-auto mt-2">
            <section className="space-y-8 pb-10 px-4">
              {categories.length === 0 && !loading ? (
                <EmptyMenuState onAddCategory={handleAddCategory} />
              ) : (
                categories.map((category, catIndex) => (
                  <CategoryItem
                    key={getCategoryId(category)}
                    category={category}
                    catIndex={catIndex}
                    loading={loading}
                    handleCategoryChange={handleCategoryChange}
                    handleItemChange={handleItemChange}
                    handleAddItem={handleAddItemWrapper}
                    toggleEditCategory={toggleEditCategoryWrapper}
                    handleSaveCategory={handleSaveCategoryWrapper}
                    handleDeleteCategory={handleDeleteCategoryWrapper}
                    handleDeleteItem={handleDeleteItemWrapper}
                    updateItemCustomizations={updateItemCustomizationsWrapper}
                    reusableExtras={reusableExtras}
                    updateItemLinkedExtras={updateItemLinkedExtrasWrapper}
                  />
                ))
              )}
            </section>
          </div>
        </div>

        {/* Sidebar with reusable extras */}
        <div className="w-[300px] flex-shrink-0 h-full border-l border-gray-300 bg-white rounded-lg shadow-md">
          <section className="h-full flex flex-col">
            <header className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="bg-gray-700 text-white p-2 rounded-lg mr-3 shadow">
                  <FontAwesomeIcon icon={faBoxesStacked} className="h-4 w-4" />
                </span>
                Reusable Extras
              </h3>
              <p className="text-gray-600 mt-1 text-sm">
                Manage common add-ons and customization options.
              </p>
            </header>
            <div className="p-4 flex-1 overflow-y-auto">
              <ReusableExtrasManager
                reusableExtras={reusableExtras}
                loadingExtras={loadingExtras}
                onAddGroup={addReusableExtraGroup}
                onUpdateGroup={updateReusableExtraGroup}
                onDeleteGroup={deleteReusableExtraGroup}
              />
            </div>
          </section>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev: typeof confirmDialog) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function MenuHeader({
  onAddCategory,
  restaurantId,
}: {
  onAddCategory: () => void;
  restaurantId: string;
}) {
  const [orderLink, setOrderLink] = useState<string | null>(null);

  const handleGetOrderLink = () => {
    const generatedLink = `${window.location.origin}/restaurant/${restaurantId}/menu`;
    setOrderLink(generatedLink);
  };

  const handleCopyLink = async () => {
    if (orderLink) {
      try {
        await navigator.clipboard.writeText(orderLink);
        toast.success("Order link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy link:", err);
        toast.error("Failed to copy link.");
      }
    }
  };

  return (
    <header className="w-full flex justify-between items-start bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4 flex-wrap gap-3 overflow-x-hidden">
    <div className="flex-1 max-w-[200px]">
      <h2 className="text-xl font-bold text-gray-800 flex items-center">
        <span className="bg-primary text-white p-2 rounded-lg mr-3 shadow-sm">
          <FontAwesomeIcon
            icon={faUtensils}
            className="h-5 w-5 md:h-6 md:w-6"
          />
        </span>
        Menu Editor
      </h2>
    </div>
  
    <div className="flex items-center space-x-3 flex-shrink-0">
      <button
        onClick={handleGetOrderLink}
        className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 text-sm"
      >
        Get Order Link
      </button>
      <button
        onClick={onAddCategory}
        className="px-3 py-1.5 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50 transition-colors duration-200 text-sm flex items-center"
      >
        <FontAwesomeIcon icon={faPlus} className="mr-1.5 h-4 w-4" />
        Add Category
      </button>
    </div>
  
    {orderLink && (
      <div className="w-full mt-4 flex flex-col justify-center sm:flex-row items-start sm:items-center gap-2 overflow-x-hidden">
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Customer Order Link:
          </label>
          <div className="relative group">
            <input
              type="text"
              readOnly
              value={orderLink}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-100 text-gray-800 text-sm font-mono truncate cursor-pointer hover:bg-gray-200 transition-colors duration-150"
              onClick={(e) => (e.target as HTMLInputElement).select()}
              title="Click to select the full link"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 group-hover:text-gray-600 text-xs">
              🔗
            </span>
          </div>
        </div>
        <div className="mt-2 sm:mt-0">
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-200 text-sm"
          >
            Copy
          </button>
        </div>
      </div>
    )}
  </header>
    );
}

function EmptyMenuState({ onAddCategory }: { onAddCategory: () => void }) {
  return (
    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-lg border border-dashed border-gray-300">
      <div className="inline-block p-5 bg-gray-100 rounded-full mb-6 shadow">
        <FontAwesomeIcon icon={faUtensils} className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-800 mb-3">Your Menu is Empty</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Get started by adding a category. For example: "Appetizers", "Main Courses", or "Drinks".
      </p>
      <button
        onClick={onAddCategory}
        className="px-7 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50 transition-colors duration-200 flex items-center mx-auto"
      >
        <FontAwesomeIcon icon={faPlus} className="mr-2 h-5 w-5" />
        Create First Category
      </button>
    </div>
  );
}
