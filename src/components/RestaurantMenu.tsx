"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { collection, getDocs, DocumentData, doc, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "../types/cart";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { withRetry, withTimeout, isNetworkError } from "@/utils/networkUtils";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUtensils, faExclamationTriangle, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

import { NestedMenuItem, ReusableExtraGroup } from "@/utils/menuTypes";
import AddToCartModal from "./AddToCartModal";

interface RestaurantMenuProps {
  restaurantId: string;
}

export default function RestaurantMenu({ restaurantId }: RestaurantMenuProps) {
  const [menuData, setMenuData] = useState<{ id: string; name: string; description?: string; items: NestedMenuItem[]; order?: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemForModal, setSelectedItemForModal] = useState<NestedMenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExtras, setModalExtras] = useState<ReusableExtraGroup[]>([]);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const { handleAddToCart } = useCart();
  const { handleError, resetError, isError, canRetry } = useErrorHandler();
  const mobileCategoryRef = useRef<HTMLDivElement>(null);

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
      
      // Create a query with ordering by the 'order' field
      const menuQuery = query(menuRef, orderBy('order', 'asc'));
      
      const fetchWithRetry = () => withRetry(
        () => withTimeout(getDocs(menuQuery)),
        3,
        1000
      );

      const querySnapshot = await fetchWithRetry();
      const categories: { id: string; name: string; description?: string; items: NestedMenuItem[]; order?: number }[] = [];

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
            items: items,
            order: data.order || 0
          });
        }
      });

      // Sort categories by order field to ensure proper ordering
      categories.sort((a, b) => (a.order || 0) - (b.order || 0));

      setMenuData(categories);
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0].name);
      }
    } catch (error) {
      if (isNetworkError(error)) {
        handleError(error as Error, "load menu");
      } else {
        toast.error("Failed to load menu. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, selectedCategory, handleError, resetError, parseMenuItem]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Close mobile category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileCategoryRef.current && !mobileCategoryRef.current.contains(event.target as Node)) {
        setIsMobileCategoryOpen(false);
      }
    };

    if (isMobileCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileCategoryOpen]);

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
    quantity: number;
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

    // Add the item with the specified quantity
    for (let i = 0; i < options.quantity; i++) {
      handleAddToCart(cartItem);
    }
    
    setIsModalOpen(false);
    setSelectedItemForModal(null);
  }, [restaurantId, menuData, modalExtras, handleAddToCart, selectedItemForModal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  if (isError && !canRetry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <FontAwesomeIcon icon={faExclamationTriangle} className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-500 mb-4 text-base font-semibold">Failed to load menu</p>
        <button
          onClick={fetchMenuData}
          className="px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-200 font-semibold shadow-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (menuData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-full mb-4">
          <FontAwesomeIcon icon={faUtensils} className="h-12 w-12 text-orange-400" />
        </div>
        <p className="text-gray-600 text-lg font-semibold">No menu items available</p>
        <p className="text-gray-500 mt-2 text-sm">Check back soon for delicious options!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Mobile Category Selector */}
      <div className="lg:hidden bg-white shadow-md border-b border-orange-50 sticky top-0 z-20" ref={mobileCategoryRef}>
        <div className="p-3">
          <button
            onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg hover:from-orange-100 hover:to-red-100 transition-all duration-200 touch-manipulation"
          >
            <div className="flex items-center">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 text-white p-1.5 rounded-md mr-3">
                <FontAwesomeIcon icon={faUtensils} className="h-3 w-3" />
              </span>
              <span className="font-semibold text-gray-700 text-sm sm:text-base">
                Vår meny
              </span>
            </div>
            <FontAwesomeIcon 
              icon={isMobileCategoryOpen ? faChevronUp : faChevronDown} 
              className="h-4 w-4 text-gray-500 transition-transform duration-200" 
            />
          </button>
          
          {/* Dropdown Menu */}
          {isMobileCategoryOpen && (
            <div className="mt-2 bg-white border border-orange-200 rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {menuData.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setIsMobileCategoryOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 transition-all duration-200 touch-manipulation border-b border-gray-100 last:border-b-0 ${
                      selectedCategory === category.name
                        ? "bg-gradient-to-r from-orange-400 to-red-400 text-white"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-25 hover:to-red-25"
                    }`}
                  >
                    <div className="font-medium text-sm sm:text-base">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Left Sidebar - Categories */}
      <div className="hidden lg:block w-64 bg-white shadow-lg border-r border-orange-50 p-4 rounded-r-xl">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
          <span className="bg-gradient-to-r from-orange-400 to-red-400 text-white p-1.5 rounded-md mr-2">
            <FontAwesomeIcon icon={faUtensils} className="h-3 w-3" />
          </span>
          Categories
        </h2>
        <div className="space-y-2">
          {menuData.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-300 transform hover:scale-102 ${
                selectedCategory === category.name
                  ? "bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-md"
                  : "text-gray-600 hover:bg-gradient-to-r hover:from-orange-25 hover:to-red-25 border border-orange-50"
              }`}
            >
              <div className="font-semibold text-base">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Selected Category Items */}
      <div className="flex-1 p-3 lg:p-6">
        {selectedCategoryData ? (
          <div>
            {/* Category Header */}
            <div className="mb-4 lg:mb-6 text-center">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                Vår meny
              </h1>
              {selectedCategoryData.description && (
                <p className="text-gray-600 text-sm lg:text-base max-w-2xl mx-auto px-2">{selectedCategoryData.description}</p>
              )}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {selectedCategoryData.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-orange-50 transform hover:scale-102 touch-manipulation"
                >
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
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-xl">
                        <span className="text-white font-bold text-xs sm:text-sm bg-red-400 px-2 sm:px-3 py-1 rounded-full">Not Available</span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-700 mb-2">{item.name}</h3>
                    
                    {item.description && (
                      <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}

                    <div className="flex flex-col gap-2 mb-3">
                      <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        {item.price.amount.toFixed(2)} Kr
                      </span>
                      
                      <button
                        onClick={() => openAddToCartModal(item)}
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
