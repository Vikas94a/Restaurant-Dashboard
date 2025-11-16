"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUtensils, faStar } from "@fortawesome/free-solid-svg-icons";
import { NestedMenuItem } from "@/utils/menuTypes";

interface MenuItemCardProps {
  item: NestedMenuItem;
  onAddToCart: (item: NestedMenuItem) => void;
}

/**
 * MenuItemCard component - Displays a single menu item with image, details, and add to cart button
 */
export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-orange-50 transform hover:scale-102 touch-manipulation">
      {/* Item Image */}
      <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-orange-25 to-red-25">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
            <div className="text-center">
              <FontAwesomeIcon icon={faUtensils} className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-orange-300 mb-1 sm:mb-2" />
              <p className="text-xs text-orange-500 font-medium">Image Coming Soon</p>
            </div>
          </div>
        )}
        {item.isPopular && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-10 flex items-center">
            <FontAwesomeIcon icon={faStar} className="w-3 h-3 mr-1" />
            Populær
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-xl">
            <span className="text-white font-bold text-xs sm:text-sm bg-red-400 px-2 sm:px-3 py-1 rounded-full">
              Not Available
            </span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-700 mb-2">
          {item.name}
        </h3>
        
        {item.description && (
          <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        <div className="flex flex-col gap-2 mb-3">
          <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            {item.price.amount.toFixed(2)} Kr
          </span>
          
          <button
            onClick={() => onAddToCart(item)}
            disabled={!item.isAvailable}
            className={`w-full flex items-center justify-center space-x-1 px-3 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm touch-manipulation ${
              item.isAvailable
                ? "bg-gradient-to-r from-orange-400 to-red-400 text-white hover:from-orange-500 hover:to-red-500 hover:scale-105 active:scale-95 shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            <span>Add to Cart</span>
          </button>
        </div>

        {/* Only show extras indicator if item actually has extras */}
        {item.linkedReusableExtraIds && item.linkedReusableExtraIds.length > 0 && (
          <div className="flex items-center text-orange-500 text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1.5"></span>
            Customizable options available
          </div>
        )}
      </div>
    </div>
  );
}

