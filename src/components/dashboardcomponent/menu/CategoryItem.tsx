"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faPlus,
  faChevronDown,
  faChevronUp,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import {
  Category,
  NestedMenuItem,
  CustomizationGroup,
  ReusableExtraGroup,
  ItemChangeField,
} from "@/hooks/useMenuEditor";
import ItemCustomizationModal from "./ItemCustomizationModal";
import { toast } from "sonner";

const CHARACTER_LIMITS = {
  CATEGORY_NAME: 80,
  CATEGORY_DESCRIPTION: 150,
  ITEM_NAME: 100,
  ITEM_DESCRIPTION: 300,
};

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
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] =
    useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] =
    useState<NestedMenuItem | null>(null);
  const [itemErrors, setItemErrors] = useState<{ [key: string]: string }>({});

  const handleCategoryClick = useCallback(() => {
    if (!category.isEditing) {
      setIsExpanded((prev) => !prev);
    }
  }, [category.isEditing]);

  const handleOpenCustomizationModal = useCallback((item: NestedMenuItem) => {
    setSelectedItemForCustomization(item);
    setIsCustomizationModalOpen(true);
  }, []);

  const handleCloseCustomizationModal = useCallback(() => {
    setSelectedItemForCustomization(null);
    setIsCustomizationModalOpen(false);
  }, []);

  const handleSaveCustomizations = useCallback(
    (itemId: string | undefined, customizations: CustomizationGroup[]) => {
      if (!selectedItemForCustomization || !itemId) return;
      const categoryId = category.docId || category.frontendId;
      if (!categoryId) {
        console.error("Category ID not found for saving customizations");
        return;
      }
      updateItemCustomizations(categoryId, itemId, customizations);
      handleCloseCustomizationModal();
    },
    [
      selectedItemForCustomization,
      category.docId,
      category.frontendId,
      updateItemCustomizations,
      handleCloseCustomizationModal,
    ]
  );

  useEffect(() => {
    if (category.isEditing) {
      setIsExpanded(true);
    }
  }, [category.isEditing]);

  return (
    <>
      <div className="mb-4 bg-white rounded-md shadow overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-200">
        <div
          className={`px-4 py-3 ${
            category.isEditing
              ? "bg-gray-50 border-b border-gray-200"
              : "bg-white border-l-4 border-orange-400"
          } flex justify-between items-center ${
            !category.isEditing ? "cursor-pointer hover:bg-gray-50" : ""
          } transition-colors duration-150`}
          onClick={!category.isEditing ? handleCategoryClick : undefined} // Refined: Only clickable when not editing
        >
          {category.isEditing ? (
            <div className="flex-1 mr-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Category Name*
                </label>
                <input
                  type="text"
                  name="categoryName"
                  value={category.categoryName}
                  onChange={(e) =>
                    handleCategoryChange(
                      catIndex,
                      "categoryName",
                      e.target.value
                    )
                  }
                  className="text-lg font-semibold px-3.5 py-2.5 border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 w-full outline-none shadow-sm transition-colors duration-150"
                  placeholder="Category Name"
                  required
                  maxLength={CHARACTER_LIMITS.CATEGORY_NAME}
                  onClick={(e) => e.stopPropagation()} // Prevent category click
                />
                <div className="text-xs text-gray-500 mt-1.5 text-right pr-1">
                  {category.categoryName.length} /{" "}
                  {CHARACTER_LIMITS.CATEGORY_NAME}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  name="categoryDescription"
                  value={category.categoryDescription || ""}
                  onChange={(e) =>
                    handleCategoryChange(
                      catIndex,
                      "categoryDescription",
                      e.target.value
                    )
                  }
                  className="text-sm text-gray-700 px-3.5 py-2.5 border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 w-full outline-none resize-none shadow-sm transition-colors duration-150"
                  placeholder="Category Description (Optional)"
                  rows={2}
                  maxLength={CHARACTER_LIMITS.CATEGORY_DESCRIPTION}
                  onClick={(e) => e.stopPropagation()} // Prevent category click
                />
                <div className="text-xs text-gray-500 mt-1.5 text-right pr-1">
                  {(category.categoryDescription || "").length} /{" "}
                  {CHARACTER_LIMITS.CATEGORY_DESCRIPTION}
                </div>
              </div>
            </div>
          ) : (
            // Display mode for category header (clickable part)
            <div className="flex-1 flex items-center min-w-0">
              <div className="flex-shrink-0 mr-3 w-8 h-8 bg-primary bg-opacity-10 rounded flex items-center justify-center text-primary">
                <FontAwesomeIcon icon={faUtensils} className="h-4 w-4" />
              </div>
              <div className="flex-grow min-w-0">
                <h3
                  className="text-sm font-bold text-gray-800 truncate"
                  title={category.categoryName || "Unnamed Category"}
                >
                  {category.categoryName || "Unnamed Category"}
                </h3>
                {category.categoryDescription && (
                  <p
                    className="text-xs text-gray-600 truncate"
                    title={category.categoryDescription}
                  >
                    {category.categoryDescription}
                  </p>
                )}
              </div>
              {/* Chevron and item count only shown when not editing */}
              <div className="ml-2 flex-shrink-0 flex items-center bg-gray-50 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                <span className="font-medium text-xs">
                  {category.items.length}
                </span>
                <span className="ml-0.5 text-xs">
                  item{category.items.length === 1 ? "" : "s"}
                </span>
                <FontAwesomeIcon
                  icon={isExpanded ? faChevronUp : faChevronDown}
                  className="ml-1.5 text-gray-400 transition-transform text-xs"
                />
              </div>
            </div>
          )}

          {/* Action buttons container */}
          <div
            className="flex items-center space-x-2 pl-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()} // Prevent actions from triggering category click
          >
            {category.isEditing ? (
              <>
                <button
                  onClick={() =>
                    // No stopPropagation needed here as parent div handles it
                    handleSaveCategory(category.docId || category.frontendId!)
                  }
                  className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 transition-colors duration-200 flex items-center shadow-sm disabled:opacity-75"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSave} className="mr-1.5 h-5 w-5" />
                  Save
                </button>
                {category.docId && (
                  <button
                    onClick={() =>
                      // No stopPropagation needed here
                      toggleEditCategory(category.docId || category.frontendId!)
                    }
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500/70 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
                    disabled={loading}
                    title="Cancel"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    // e is not used here for stopPropagation, parent div handles it
                    toggleEditCategory(category.docId || category.frontendId!);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600/70 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
                  disabled={loading}
                  title="Edit Category"
                >
                  <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                </button>
                <button
                  onClick={async (e) => {
                    // e is not used here for stopPropagation
                    const categoryId = category.docId || category.frontendId;
                    if (!categoryId) {
                      console.error(
                        "Cannot delete category: No valid ID found"
                      );
                      return;
                    }
                    try {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this category? This action cannot be undone."
                        )
                      ) {
                        await handleDeleteCategory(categoryId);
                      }
                    } catch (error) {
                      console.error("Error deleting category:", error);
                      toast.error(
                        "Failed to delete category. Please check your permissions and try again."
                      );
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600/70 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
                  disabled={loading}
                  title="Delete Category"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Expandable content area */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            {!category.isEditing && category.items.length > 0 && (
              <div className="mb-3 pb-2 border-b border-gray-200 flex justify-between items-center">
                <h4 className="text-xs font-semibold text-gray-700 flex items-center">
                  <span className="h-3 w-1 bg-primary rounded mr-2"></span>
                  Menu Items
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Keep stopPropagation here if this button is outside the main action buttonstopPropagation logic
                    toggleEditCategory(category.docId || category.frontendId!);
                  }}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600/70 focus:ring-offset-1"
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-1 h-3 w-3" />
                  Edit Items
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {category.items.map((item, itemIndex) => (
                <div
                  key={item.frontendId}
                  className={`bg-white rounded-md border flex flex-col shadow-sm hover:shadow transition-shadow duration-200 overflow-hidden ${
                    category.isEditing ? "border-primary" : "border-gray-200"
                  }`}
                >
                  {category.isEditing ? (
                    <div className="p-3 space-y-3 w-full">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Item Name*
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={item.name || item.itemName || ""}
                            onChange={(e) =>
                              handleItemChange(
                                catIndex,
                                itemIndex,
                                "name",
                                e.target.value
                              )
                            }
                            className={`w-full p-2.5 border ${
                              itemErrors[`${item.id || item.frontendId}-name`]
                                ? "border-red-500 focus:border-red-600 focus:ring-red-500/50"
                                : "border-gray-300 focus:border-primary focus:ring-primary/50"
                            } rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 text-sm font-medium bg-white transition-all duration-150 hover:shadow-md`}
                            placeholder="Item Name (e.g., Margherita Pizza)"
                            required
                            maxLength={CHARACTER_LIMITS.ITEM_NAME}
                            onClick={(e) => e.stopPropagation()} // Prevent item input click from bubbling if category.isEditing makes items directly part of a clickable area
                          />
                          <div className="text-xs text-gray-500 mt-0.5 text-right">
                            {(item.name || item.itemName || "").length} /{" "}
                            {CHARACTER_LIMITS.ITEM_NAME}
                          </div>
                        </div>

                        <div className="sm:w-1/4 w-1/2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Price ($)*
                          </label>
                          <input
                            type="number"
                            name="priceAmount"
                            value={item.price?.amount || item.itemPrice || 0}
                            onChange={(e) =>
                              handleItemChange(
                                catIndex,
                                itemIndex,
                                "priceAmount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 text-sm text-gray-700 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-150 hover:shadow-md"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                            onClick={(e) => e.stopPropagation()} // Prevent item input click from bubbling
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={item.description || item.itemDescription || ""}
                          onChange={(e) =>
                            handleItemChange(
                              catIndex,
                              itemIndex,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 text-xs text-gray-600 bg-white resize-none transition-all duration-150 hover:shadow-md h-20"
                          placeholder="Describe the item (optional)"
                          rows={2}
                          maxLength={CHARACTER_LIMITS.ITEM_DESCRIPTION}
                          onClick={(e) => e.stopPropagation()} // Prevent item input click from bubbling
                        />
                        <div className="text-xs text-gray-500 mt-0.5 text-right">
                          {
                            (item.description || item.itemDescription || "")
                              .length
                          }{" "}
                          / {CHARACTER_LIMITS.ITEM_DESCRIPTION}
                        </div>
                      </div>

                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenCustomizationModal(item)}
                          className="w-full px-2 py-1.5 text-xs font-medium text-primary-dark border border-primary-light rounded hover:bg-primary-light hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-1 transition-colors duration-150"
                        >
                          <FontAwesomeIcon
                            icon={faPlus}
                            className="mr-1.5"
                            size="xs"
                          />{" "}
                          Manage Item Options
                        </button>
                      </div>

                      <div className="flex justify-end mt-2">
                        <button
                          onClick={async () => {
                            try {
                              const categoryId =
                                category.docId || category.frontendId;
                              const itemId = item.id || item.frontendId;
                              if (!categoryId || !itemId) {
                                console.error(
                                  "Cannot delete item: Missing IDs"
                                );
                                return;
                              }
                              if (
                                window.confirm(
                                  "Are you sure you want to remove this item? This action cannot be undone."
                                )
                              ) {
                                await handleDeleteItem(categoryId, itemId);
                              }
                            } catch (error) {
                              console.error("Error deleting item:", error);
                              toast.error(
                                "Failed to delete item. Please check your permissions and try again."
                              );
                            }
                          }}
                          className="flex items-center text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-600/70 focus:ring-offset-1 disabled:opacity-75"
                          disabled={loading}
                          title="Remove Item"
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="mr-1 h-3 w-3"
                          />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 flex-grow">
                        <h5
                          className="text-sm font-semibold text-gray-800 truncate"
                          title={item.name || item.itemName || "Unnamed Item"}
                        >
                          {item.name || item.itemName || "Unnamed Item"}
                        </h5>
                        {(item.description || item.itemDescription) && (
                          <p
                            className="text-xs text-gray-600 truncate mt-0.5"
                            title={item.description || item.itemDescription}
                          >
                            {item.description || item.itemDescription}
                          </p>
                        )}
                      </div>
                      <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex items-center text-gray-500">
                          <span className="text-xs">Price</span>
                        </div>
                        <div className="text-primary font-bold text-sm">
                          $
                          {(item.price?.amount || item.itemPrice || 0).toFixed(
                            2
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {category.items.length === 0 &&
                !category.isEditing &&
                isExpanded && (
                  <div className="text-center py-6 px-4 bg-white rounded border border-dashed border-gray-300">
                    <FontAwesomeIcon
                      icon={faUtensils}
                      className="h-6 w-6 text-gray-300 mb-2"
                    />
                    <p className="text-gray-600 text-sm mb-1">
                      No items in this category yet.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Keep stopPropagation here
                        toggleEditCategory(
                          category.docId || category.frontendId!
                        );
                      }}
                      className="mt-2 text-xs text-primary hover:text-primary-dark font-medium py-1 px-2 rounded hover:bg-primary-lightest transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-1"
                    >
                      Add First Item
                    </button>
                  </div>
                )}
              {category.items.length === 0 && category.isEditing && (
                <div className="text-center py-5 px-4 bg-gray-50 rounded border border-dashed border-gray-300">
                  <FontAwesomeIcon
                    icon={faUtensils}
                    className="h-6 w-6 text-gray-300 mb-2"
                  />
                  <p className="text-gray-600 text-sm mb-1">
                    This category is empty.
                  </p>
                  <p className="text-xs text-gray-500">
                    Click "Add New Item" to get started.
                  </p>
                </div>
              )}

              {category.isEditing && (
                <div
                  className="border border-dashed border-gray-300 bg-white rounded p-3 min-h-[120px] flex flex-col items-center justify-center text-center hover:border-primary hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                  onClick={() =>
                    // This click is for adding an item, not category expansion.
                    handleAddItem(category.docId || category.frontendId!)
                  }
                  title="Add a new item to this category"
                >
                  <div className="p-2 bg-primary bg-opacity-10 rounded mb-2 transition-transform duration-200 group-hover:scale-110">
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="h-4 w-4 text-primary"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-primary-dark">
                    Add New Item
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    to '{category.categoryName || "this category"}'
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedItemForCustomization && (
        <ItemCustomizationModal
          isOpen={isCustomizationModalOpen}
          onClose={handleCloseCustomizationModal}
          item={selectedItemForCustomization}
          reusableExtras={reusableExtras}
          onSaveLinkedExtras={(itemIdFromModal, linkedGroupIds) => {
            const categoryId = category.docId || category.frontendId;
            const currentItemId =
              itemIdFromModal ||
              selectedItemForCustomization?.id ||
              selectedItemForCustomization?.frontendId;
            if (categoryId && currentItemId) {
              const transformedLinkedExtras = linkedGroupIds.reduce(
                (acc, groupId) => {
                  acc[groupId] = [];
                  return acc;
                },
                {} as { [key: string]: string[] }
              );
              updateItemLinkedExtras(
                categoryId,
                currentItemId,
                transformedLinkedExtras
              );
            }
            handleCloseCustomizationModal();
          }}
        />
      )}
    </>
  );
}
