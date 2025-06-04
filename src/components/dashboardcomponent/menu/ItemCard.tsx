import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faBoxesStacked,
} from "@fortawesome/free-solid-svg-icons";
import { NestedMenuItem, CustomizationGroup, ReusableExtraGroup } from "@/utils/menuTypes";
import { toast } from "sonner";

const CHARACTER_LIMITS = {
  ITEM_NAME: 100,
  ITEM_DESCRIPTION: 300,
};

interface ItemCardProps {
  item: NestedMenuItem;
  itemIndex: number;
  catIndex: number;
  categoryId: string;
  loading: boolean;
  isEditing: boolean;
  handleItemChange: (
    catIndex: number,
    itemIndex: number,
    field: string,
    value: string | number | boolean | string[]
  ) => void;
  handleDeleteItem: (categoryId: string, itemId: string) => Promise<void>;
  onOpenCustomizationModal: (item: NestedMenuItem) => void;
  reusableExtras: ReusableExtraGroup[];
}

export default function ItemCard({
  item,
  itemIndex,
  catIndex,
  categoryId,
  loading,
  isEditing,
  handleItemChange,
  handleDeleteItem,
  onOpenCustomizationModal,
  reusableExtras,
}: ItemCardProps) {
  return (
    <div
      key={`${categoryId}-${item.id || item.frontendId || `item-${itemIndex}`}`}
      className="w-full bg-white rounded shadow-sm border border-gray-200 hover:shadow transition-shadow duration-200"
    >
      {isEditing ? (
        <div className="p-3 space-y-3 w-full">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Item Name*
              </label>
              <input
                type="text"
                name="name"
                value={item.name || ""}
                onChange={(e) =>
                  handleItemChange(
                    catIndex,
                    itemIndex,
                    "name",
                    e.target.value
                  )
                }
                className="text-sm font-semibold p-2 border border-gray-300 rounded-md w-full focus:ring-primary focus:border-primary shadow-sm overflow-x-auto"
                placeholder="Item Name (e.g., Margherita Pizza)"
                required
                maxLength={CHARACTER_LIMITS.ITEM_NAME}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="text-xs text-gray-500 mt-0.5 text-right">
                {(item.name || "").length} / {CHARACTER_LIMITS.ITEM_NAME}
              </div>
            </div>

            <div className="sm:w-1/4 w-1/2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Price ($)*
              </label>
              <input
                type="number"
                name="priceAmount"
                value={item.price?.amount || 0}
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
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={item.description || ""}
              onChange={(e) =>
                handleItemChange(
                  catIndex,
                  itemIndex,
                  "description",
                  e.target.value
                )
              }
              className="text-xs p-2 border border-gray-300 rounded-md w-full focus:ring-primary focus:border-primary resize-none shadow-sm overflow-x-auto"
              placeholder="Describe the item (optional)"
              rows={2}
              maxLength={CHARACTER_LIMITS.ITEM_DESCRIPTION}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-xs text-gray-500 mt-0.5 text-right">
              {(item.description || "").length} /{" "}
              {CHARACTER_LIMITS.ITEM_DESCRIPTION}
            </div>
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={() => onOpenCustomizationModal(item)}
              className="w-full px-2 py-1.5 text-xs font-medium text-primary-dark border border-primary-light rounded hover:bg-primary-light hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-1 transition-colors duration-150"
            >
              <FontAwesomeIcon
                icon={faPlus}
                className="mr-1.5"
                size="xs"
              />
              Manage Item Options
            </button>
          </div>

          {/* Display linked reusable extras */}
          {item.linkedReusableExtraIds && item.linkedReusableExtraIds.length > 0 && (
            <div className="mt-2">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Linked Extras:</h4>
              <div className="space-y-1">
                {item.linkedReusableExtraIds.map((groupId) => {
                  const extraGroup = reusableExtras.find(group => group.id === groupId);
                  if (!extraGroup) return null;
                  return (
                    <div
                      key={groupId}
                      className="flex items-center text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200"
                    >
                      <FontAwesomeIcon
                        icon={faBoxesStacked}
                        className="h-3 w-3 text-gray-500 mr-1.5"
                      />
                      <span className="text-gray-600">{extraGroup.groupName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button
              onClick={async () => {
                try {
                  const itemId = item.id;
                  if (!categoryId || !itemId) {
                    console.error("Cannot delete item: Missing IDs");
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
            <h4
              className="text-base font-semibold text-gray-800 group-hover:text-primary transition-colors duration-150 truncate"
              title={item.name || "Unnamed Item"}
            >
              {item.name || "Unnamed Item"}
            </h4>
            {item.description && (
              <p
                className="text-xs text-gray-600 truncate mt-0.5"
                title={item.description}
              >
                {item.description}
              </p>
            )}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center text-gray-500">
              <span className="text-xs">Price</span>
            </div>
            <div className="text-primary font-bold text-sm">
              ${(item.price?.amount || 0).toFixed(2)}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 