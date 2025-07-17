import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setEditingCategory } from "@/store/features/menuSlice";
import {
  faEdit,
  faPlus,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { Category, NestedMenuItem, ReusableExtraGroup, CustomizationGroup, ItemChangeField } from "@/utils/menuTypes";
import { toast } from "sonner";
import ItemCard from "./ItemCard";
import { replaceImage } from "@/utils/uploadImage"
import { useState } from "react";

interface ItemListProps {
  category: Category;
  catIndex: number;
  loading: boolean;
  handleItemChange: (
    catIndex: number,
    itemIndex: number,
    field: ItemChangeField,
    value: string | number | boolean | string[]
  ) => void;
  handleAddItem: (categoryId: string) => Promise<void>;
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
  isExpanded: boolean;
  onOpenCustomizationModal: (item: NestedMenuItem) => void;
  toggleEditCategory: (categoryId: string) => void;
  handleSaveCategory: (categoryId: string) => Promise<void>;
}

export default function ItemList({
  category,
  catIndex,
  loading,
  handleItemChange,
  handleAddItem,
  handleDeleteItem,
  updateItemCustomizations,
  reusableExtras,
  updateItemLinkedExtras,
  isExpanded,
  onOpenCustomizationModal,
  toggleEditCategory,
  handleSaveCategory,
}: ItemListProps) {
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null);
  const dispatch = useDispatch();
  const editingCategoryId = useSelector((state: RootState) => state.menu.editingCategoryId);
  const isEditing = editingCategoryId === (category.docId || category.frontendId);

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const categoryId = category.docId || category.frontendId;
    if (categoryId) {
      dispatch(setEditingCategory(isEditing ? null : categoryId));
      toggleEditCategory(categoryId);
    }
  };

  const handleAddItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const categoryId = category.docId || category.frontendId;
    if (categoryId) {
      handleAddItem(categoryId);
    }
  };

  // Function to handle changes to item properties
  const handleImageChange = async (catIndex: number, itemIndex: number, file: File) => {
    const item = category.items[itemIndex];
    if (!item || !file) return;
    const itemId = item.id;
    if (!itemId) return;
  
    try {
      setUploadingItemIndex(itemIndex);
      const oldImageUrl = item.imageUrl;
      const imageUrl = await replaceImage(file, itemId, oldImageUrl);
      handleItemChange(catIndex, itemIndex, "imageUrl", imageUrl);
      
      // Save the category to persist the image URL
      if (category.docId || category.frontendId) {
        await handleSaveCategory(category.docId || category.frontendId!);
      }
      
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image.");
      } finally {
      setUploadingItemIndex(null);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {!isEditing && category.items.length > 0 && (
        <div className="mb-3 pb-2 border-b border-gray-200 flex justify-between items-center">
          <h4 className="text-xs font-semibold text-gray-700 flex items-center">
            <span className="h-3 w-1 bg-primary rounded mr-2"></span>
            Menu Items
          </h4>
          <button
            onClick={handleEditClick}
            className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600/70 focus:ring-offset-1"
          >
            <FontAwesomeIcon icon={faEdit} className="mr-1 h-3 w-3" />
            Edit Items
          </button>
        </div>
      )}

      <div className="space-y-4">
        {category.items.map((item, itemIndex) => (
          <ItemCard
            key={`${category.docId || category.frontendId}-${item.id || item.frontendId || `item-${itemIndex}`}`}
            item={item}
            itemIndex={itemIndex}
            catIndex={catIndex}
            categoryId={category.docId || category.frontendId!}
            loading={loading}
            isEditing={isEditing}
            handleItemChange={handleItemChange}
            handleDeleteItem={handleDeleteItem}
            onOpenCustomizationModal={onOpenCustomizationModal}
            reusableExtras={reusableExtras}
            handleImageChange={handleImageChange}
            isUploading={uploadingItemIndex === itemIndex}
            updateItemCustomizations={updateItemCustomizations}
            updateItemLinkedExtras={updateItemLinkedExtras}
          />
        ))}

        {category.items.length === 0 && !isEditing && isExpanded && (
          <div className="text-center py-6 px-4 bg-white rounded border border-dashed border-gray-300">
            <FontAwesomeIcon
              icon={faUtensils}
              className="h-6 w-6 text-gray-300 mb-2"
            />
            <p className="text-gray-600 text-sm mb-1">
              No items in this category yet.
            </p>
            <button
              onClick={handleEditClick}
              className="mt-2 text-xs text-primary hover:text-primary-dark font-medium py-1 px-2 rounded hover:bg-primary-lightest transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-1"
            >
              Add First Item
            </button>
          </div>
        )}

        {category.items.length === 0 && isEditing && (
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

        {isEditing && (
          <button
            onClick={handleAddItemClick}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-primary hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600 hover:text-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            <span className="font-medium">Add Item</span>
          </button>
        )}
      </div>
    </div>
  );
}