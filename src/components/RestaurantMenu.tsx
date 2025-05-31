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

  const parseMenuItem = useCallback((doc: DocumentData): MenuItem | null => {
    const data = doc.data();
    if (!data) return null;

    const item: MenuItem = {
      id: doc.id,
      name: data.name || '',
      price: Number(data.price) || 0,
      category: data.category || 'Uncategorized',
      description: data.description,
      imageUrl: data.imageUrl,
      available: Boolean(data.available),
      customizations: data.customizations || [],
    };

    return isMenuItem(item) ? item : null;
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
      const categories = new Map<string, MenuItem[]>();

      querySnapshot.forEach((doc) => {
        const item = parseMenuItem(doc);
        if (item) {
          const category = item.category;
          if (!categories.has(category)) {
            categories.set(category, []);
          }
          categories.get(category)?.push(item);
        }
      });

      const formattedData: MenuCategory[] = Array.from(categories.entries())
        .map(([name, items]) => ({
          id: name,
          name,
          items,
        }))
        .filter(isMenuCategory);

      setMenuData(formattedData);
      if (formattedData.length > 0 && !selectedCategory) {
        setSelectedCategory(formattedData[0].name);
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

  return (
    <div className="p-4">
      <div className="flex space-x-4 mb-4 overflow-x-auto">
        {menuData.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-4 py-2 rounded ${
              selectedCategory === category.name
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {selectedCategoryData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedCategoryData.items.map((item) => (
            <div
              key={item.id}
              className="border rounded p-4 flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-gray-600">${item.price.toFixed(2)}</p>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                )}
              </div>
              <button
                onClick={() => handleAddItemToCart(item)}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={!item.available}
              >
                {item.available ? 'Add to Cart' : 'Not Available'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
