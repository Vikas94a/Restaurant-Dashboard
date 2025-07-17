import React, { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUtensils, faExchangeAlt } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface MenuHeaderProps {
  onAddCategory: () => void;
  restaurantId: string;
  onMigrateMenuData?: () => Promise<void>;
}

/**
 * Menu header component with actions like add category and get order link
 */
const MenuHeader: React.FC<MenuHeaderProps> = ({ 
  onAddCategory, 
  restaurantId,
  onMigrateMenuData 
}) => {
  const [orderLink, setOrderLink] = useState<string | null>(null);

  const handleGetOrderLink = useCallback(() => {
    const generatedLink = `${window.location.origin}/restaurant/${restaurantId}/menu`;
    setOrderLink(generatedLink);
  }, [restaurantId]);

  const handleCopyLink = useCallback(async () => {
    if (orderLink) {
      try {
        await navigator.clipboard.writeText(orderLink);
        toast.success("Order link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link.");
      }
    }
  }, [orderLink]);

  return (
    <header className="w-full overflow-hidden flex justify-between items-start bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 flex-wrap gap-2">
      <div className="flex-1 max-w-[200px]">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="bg-primary text-white p-1.5 rounded-lg mr-2 shadow-sm">
            <FontAwesomeIcon
              icon={faUtensils}
              className="h-4 w-4"
            />
          </span>
          Menu Editor
        </h2>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        {onMigrateMenuData && (
          <button
            onClick={onMigrateMenuData}
            className="px-2 py-1 bg-yellow-500 text-white font-medium rounded text-xs shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center"
            title="Migrate legacy menu data format to new format"
          >
            <FontAwesomeIcon icon={faExchangeAlt} className="mr-1 h-3 w-3" />
            Migrate Data
          </button>
        )}
        <button
          onClick={handleGetOrderLink}
          className="px-2 py-1 bg-blue-600 text-white font-medium rounded text-xs shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center"
        >
          Get Order Link
        </button>
        <button
          onClick={onAddCategory}
          className="px-2 py-1 bg-primary text-white font-medium rounded text-xs shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50 transition-colors duration-200 flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
          Add Category
        </button>
      </div>

      {orderLink && (
        <div className="w-full mt-2 flex flex-col justify-center sm:flex-row items-start sm:items-center gap-1">
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700">
              Customer Order Link:
            </label>
            <div className="relative group">
              <input
                type="text"
                readOnly
                value={orderLink}
                className="w-full px-2 py-1 pr-8 border border-gray-300 rounded bg-gray-100 text-gray-800 text-xs font-mono truncate cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                onClick={(e) => (e.target as HTMLInputElement).select()}
                title="Click to select the full link"
              />
              <span className="absolute inset-y-0 right-2 flex items-center text-gray-400 group-hover:text-gray-600 text-xs">
                🔗
              </span>
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-3 py-1 bg-green-600 text-white font-medium rounded shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-200 text-xs"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default React.memo(MenuHeader);
