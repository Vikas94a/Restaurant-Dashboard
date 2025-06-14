"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { collection, getDocs, DocumentData, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "../types/cart";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { withRetry, withTimeout, isNetworkError } from "@/utils/networkUtils";
import { toast } from "sonner";
import { MenuItem, MenuCategory, isMenuItem, isMenuCategory } from "@/types/menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUtensils, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import CustomerExtrasModal from "./CustomerExtrasModal";
import { NestedMenuItem, ReusableExtraGroup } from "@/utils/menuTypes";
import AddToCartModal from "./AddToCartModal";

interface RestaurantMenuProps {
  restaurantId: string;
}

export default function RestaurantMenu({ restaurantId }: RestaurantMenuProps) {
  const [menuData, setMenuData] = useState<{ id: string; name: string; description?: string; items: NestedMenuItem[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemForModal, setSelectedItemForModal] = useState<NestedMenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExtras, setModalExtras] = useState<ReusableExtraGroup[]>([]);
  const { handleAddToCart } = useCart();
  const { handleError, resetError, isError, canRetry } = useErrorHandler();

  const parseMenuItem = useCallback((item: any, categoryId: string, itemIndex: number): NestedMenuItem | null => {
    if (!item) return null;

    const parsedItem: NestedMenuItem = {
      id: item.id || `item-${categoryId}-${itemIndex}-${Date.now()}`,
      name: item.name || '',
      price: {
        amount: typeof item.price?.amount === 'number' ? item.price.amount : 0,
        currency: item.price?.currency || 'NOK'
      },
      category: item.category || 'Uncategorized',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isAvailable: Boolean(item.isAvailable),
      customizations: item.customizations || [],
      linkedReusableExtraIds: item.linkedReusableExtraIds || [],
    };

    return parsedItem;
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
      const categories: { id: string; name: string; description?: string; items: NestedMenuItem[] }[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const items = (data.items || []).map((item: any, index: number) => 
          parseMenuItem(item, doc.id, index)
        ).filter(Boolean) as NestedMenuItem[];
        
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

  const selectedCategoryData = useMemo(() => {
    return menuData.find(cat => cat.name === selectedCategory);
  }, [menuData, selectedCategory]);

  const openAddToCartModal = useCallback(async (item: NestedMenuItem) => {
    const extras: ReusableExtraGroup[] = [];
    if (item.linkedReusableExtraIds && item.linkedReusableExtraIds.length > 0) {
      for (const id of item.linkedReusableExtraIds) {
        const ref = doc(db, "restaurants", restaurantId, "reusableExtraGroups", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          extras.push({ id, ...snap.data() } as ReusableExtraGroup);
        }
      }
    }
    setModalExtras(extras);
    setSelectedItemForModal(item);
    setIsModalOpen(true);
  }, [restaurantId]);

  const handleModalAddToCart = useCallback((options: {
    selectedExtras: { groupId: string; choiceId: string }[];
    specialRequest: string;
    totalPrice: number;
  }) => {
    if (!selectedItemForModal) return;
    const item = selectedItemForModal;
    const categoryData = menuData.find(cat => 
      cat.items.some(i => i.id === item.id)
    );

    // Build customizations from selectedExtras
    const customizations: any[] = [];
    for (const { groupId, choiceId } of options.selectedExtras) {
      const group = modalExtras.find(g => g.id === groupId);
      const choice = group?.choices.find(c => c.id === choiceId);
      if (group && choice) {
        let customization = customizations.find(c => c.category === group.groupName);
        if (!customization) {
          customization = { category: group.groupName, options: [] };
          customizations.push(customization);
        }
        customization.options.push({
          id: choice.id,
          name: choice.name,
          price: choice.price,
          category: group.groupName
        });
      }
    }

    const cartItem: Omit<CartItem, "id" | "quantity"> = {
      restaurantId,
      itemName: item.name,
      itemPrice: item.price.amount,
      categoryName: categoryData?.name || 'Unknown',
      customizations,
      totalPrice: options.totalPrice,
      imageUrl: item.imageUrl,
      specialInstructions: options.specialRequest ? { text: options.specialRequest, timestamp: Date.now() } : undefined,
    };

    handleAddToCart(cartItem);
    setIsModalOpen(false);
    setSelectedItemForModal(null);
  }, [restaurantId, menuData, modalExtras, handleAddToCart, selectedItemForModal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError && !canRetry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <FontAwesomeIcon icon={faExclamationTriangle} className="h-16 w-16 text-red-500 mb-4" />
        <p className="text-red-500 mb-4 text-lg">Failed to load menu</p>
        <button
          onClick={fetchMenuData}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (menuData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <FontAwesomeIcon icon={faUtensils} className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">No menu items available</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar - Categories */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Categories</h2>
        <div className="space-y-2">
          {menuData.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                selectedCategory === category.name
                  ? "bg-primary text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="font-medium">{category.name}</div>
              <div className="text-sm opacity-75">
                {category.items.length} item{category.items.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Selected Category Items */}
      <div className="flex-1 p-6">
        {selectedCategoryData ? (
          <div>
            {/* Category Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedCategoryData.name}
              </h1>
              {selectedCategoryData.description && (
                <p className="text-gray-600 text-lg">{selectedCategoryData.description}</p>
              )}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategoryData.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Item Image */}
                  <div className="relative h-48 bg-gray-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <div className="text-center">
                          <FontAwesomeIcon icon={faUtensils} className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Image Coming Soon</p>
                        </div>
                      </div>
                    )}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">Not Available</span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{item.name}</h3>
                    
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {item.price.amount.toFixed(2)} Kr
                      </span>
                      
                      <button
                        onClick={() => openAddToCartModal(item)}
                        disabled={!item.isAvailable}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                          item.isAvailable
                            ? "bg-primary text-white hover:bg-primary-dark hover:scale-105 active:scale-95"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                        <span className="font-medium">Add</span>
                      </button>
                    </div>

                    {/* Only show extras indicator if item actually has extras */}
                    {item.linkedReusableExtraIds && item.linkedReusableExtraIds.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        Customizable options available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Select a category to view items</p>
          </div>
        )}
      </div>

      {/* Item Customization Modal */}
      {selectedItemForModal && (
        <AddToCartModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItemForModal(null);
          }}
          item={selectedItemForModal}
          extras={modalExtras}
          onAddToCart={handleModalAddToCart}
        />
      )}
    </div>
  );
}
