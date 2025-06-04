"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "../types/cart";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { withRetry, withTimeout, isNetworkError } from "@/utils/networkUtils";
import { toast } from "sonner";
import { MenuItem, MenuCategory, isMenuItem, isMenuCategory } from "@/types/menu";

interface RestaurantMenuProps {
  restaurantId: string;
}

export default function RestaurantMenu({ restaurantId }: RestaurantMenuProps) {
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { handleAddToCart } = useCart();
  const { handleError, resetError, isError, canRetry } = useErrorHandler();

  const parseMenuItem = useCallback((item: any, categoryId: string, itemIndex: number): MenuItem | null => {
    if (!item) return null;

    const parsedItem: MenuItem = {
      id: item.id || `item-${categoryId}-${itemIndex}-${Date.now()}`,
      name: item.name || '',
      price: typeof item.price?.amount === 'number' ? item.price.amount : 0,
      category: item.category || 'Uncategorized',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      available: Boolean(item.isAvailable),
      customizations: item.customizations || [],
    };

    return isMenuItem(parsedItem) ? parsedItem : null;
  }, []);

  const fetchMenuData = useCallback(async () => {
    try {
      setIsLoading(true);
      resetError();
      const menuRef = collection(db, "restaurants", restaurantId, "menu");
      
      const fetchWithRetry = () => withRetry(
        () => withTimeout(getDocs(menuRef)),
        3,
        1000
      );

      const querySnapshot = await fetchWithRetry();
      const categories: MenuCategory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const items = (data.items || []).map((item: any, index: number) => 
          parseMenuItem(item, doc.id, index)
        ).filter(Boolean) as MenuItem[];
        
        if (items.length > 0) {
          categories.push({
            id: doc.id,
            name: data.categoryName || 'Uncategorized',
            description: data.categoryDescription,
            items: items
          });
        }
      });

      setMenuData(categories);
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0].name);
      }
    } catch (error) {
      if (isNetworkError(error)) {
        handleError(error as Error, "load menu");
      } else {
        console.error("Error fetching menu:", error);
        toast.error("Failed to load menu. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, selectedCategory, handleError, resetError, parseMenuItem]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  const selectedCategoryData = useMemo(
    () => menuData.find((cat) => cat.name === selectedCategory),
    [menuData, selectedCategory]
  );

  const handleAddItemToCart = useCallback((item: MenuItem) => {
    if (!selectedCategoryData?.name) return;

    const cartItem: Omit<CartItem, "id" | "quantity"> = {
      restaurantId,
      itemName: item.name,
      itemPrice: item.price,
      categoryName: selectedCategoryData.name,
      customizations: item.customizations?.map(customization => ({
        category: customization.name,
        options: customization.options.map(option => ({
          id: option.id,
          name: option.name,
          price: option.price,
          category: customization.name
        }))
      })) || [],
      totalPrice: item.price
    };

    handleAddToCart(cartItem);
  }, [restaurantId, selectedCategoryData?.name, handleAddToCart]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (isError && !canRetry) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">Failed to load menu</p>
        <button
          onClick={fetchMenuData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (menuData.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-gray-600">No menu items available</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Categories</h2>
          <div className="space-y-2">
            {menuData.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  selectedCategory === category.name
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Display */}
        <div className="col-span-9">
          {selectedCategoryData ? (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">{selectedCategoryData.name}</h2>
              {selectedCategoryData.description && (
                <p className="text-gray-600 mb-6">{selectedCategoryData.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCategoryData.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-grow">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">{item.name}</h3>
                        <p className="text-blue-600 font-semibold mb-2">${item.price.toFixed(2)}</p>
                        {item.description && (
                          <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddItemToCart(item)}
                        className={`mt-4 w-full py-2 px-4 rounded-lg transition-colors duration-200 ${
                          item.available
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={!item.available}
                      >
                        {item.available ? 'Add to Cart' : 'Not Available'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a category to view items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
