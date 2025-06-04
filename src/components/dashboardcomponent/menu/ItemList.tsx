import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faPlus,
  faUtensils,
  faBoxesStacked,
} from "@fortawesome/free-solid-svg-icons";
import { Category, NestedMenuItem, CustomizationGroup, ReusableExtraGroup } from "@/utils/menuTypes";
import { toast } from "sonner";
import ItemCard from "./ItemCard";

const CHARACTER_LIMITS = {
  ITEM_NAME: 100,
  ITEM_DESCRIPTION: 300,
};

interface ItemListProps {
  category: Category;
  catIndex: number;
  loading: boolean;
  handleItemChange: (
    catIndex: number,
    itemIndex: number,
    field: string,
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
}: ItemListProps) {
  return (
    <>
      {!category.isEditing && category.items.length > 0 && (
        <div className="mb-3 pb-2 border-b border-gray-200 flex justify-between items-center">
          <h4 className="text-xs font-semibold text-gray-700 flex items-center">
            <span className="h-3 w-1 bg-primary rounded mr-2"></span>
            Menu Items
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
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
          <ItemCard
            key={`${category.docId || category.frontendId}-${item.id || item.frontendId || `item-${itemIndex}`}`}
            item={item}
            itemIndex={itemIndex}
            catIndex={catIndex}
            categoryId={category.docId || category.frontendId!}
            loading={loading}
            isEditing={category.isEditing}
            handleItemChange={handleItemChange}
            handleDeleteItem={handleDeleteItem}
            onOpenCustomizationModal={onOpenCustomizationModal}
            reusableExtras={reusableExtras}
          />
        ))}

        {category.items.length === 0 && !category.isEditing && isExpanded && (
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
                e.stopPropagation();
                toggleEditCategory(category.docId || category.frontendId!);
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
          <button
            onClick={() => handleAddItem(category.docId || category.frontendId!)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-primary hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600 hover:text-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            <span className="font-medium">Add Item</span>
          </button>
        )}
      </div>
    </>
  );
} 