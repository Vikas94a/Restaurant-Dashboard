"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "../types/cart";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { withRetry, withTimeout, isNetworkError } from "@/utils/networkUtils";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

import { NestedMenuItem, ReusableExtraGroup } from "@/utils/menuTypes";
import AddToCartModal from "./AddToCartModal";
import CategoryTabs from "./menu/CategoryTabs";
import MenuCategorySection from "./menu/MenuCategorySection";
import { useCategoryScroll } from "@/hooks/useCategoryScroll";

interface RestaurantMenuProps {
  restaurantId: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: NestedMenuItem[];
  order?: number;
}

/**
 * RestaurantMenu component - Main menu display component
 * Handles:
 * - Menu data fetching from Firebase
 * - Category navigation and scroll tracking
 * - Item selection and cart addition
 * - Modal management for item customization
 */
export default function RestaurantMenu({ restaurantId }: RestaurantMenuProps) {
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemForModal, setSelectedItemForModal] = useState<NestedMenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExtras, setModalExtras] = useState<ReusableExtraGroup[]>([]);
  const { handleAddToCart } = useCart();
  const { handleError, resetError, isError, canRetry } = useErrorHandler();
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Parse menu item from Firebase data
  const parseMenuItem = useCallback((item: any, categoryId: string, itemIndex: number): NestedMenuItem | null => {
    if (!item) return null;

    return {
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
  }, []);

  // Fetch menu data from Firebase
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
      const categories: MenuCategory[] = [];

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
      // Set initial active category only if not already set
      setActiveCategory(prev => prev || (categories.length > 0 ? categories[0].name : null));
    } catch (error) {
      if (isNetworkError(error)) {
        handleError(error as Error, "load menu");
      } else {
        toast.error("Failed to load menu. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, handleError, resetError, parseMenuItem]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Use category scroll hook for scroll tracking and navigation
  const { scrollToCategory, categoryTabRef } = useCategoryScroll({
    menuData,
    activeCategory,
    setActiveCategory,
    categoryRefs,
  });

  // Open modal for item customization
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

  // Handle adding item to cart from modal
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  // Error state
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

  // Empty state
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
    <div className="flex flex-col min-h-screen w-full">
      {/* Category Tabs */}
      <CategoryTabs
        categories={menuData}
        activeCategory={activeCategory}
        onCategoryClick={scrollToCategory}
        categoryTabRef={categoryTabRef}
      />

      {/* Main Content - All Categories and Items */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 lg:p-6">
        {menuData.length > 0 ? (
          <div className="space-y-8 lg:space-y-12">
            {menuData.map((category) => {
              const categoryElementId = `category-${category.name.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <MenuCategorySection
                  key={category.id}
                  categoryId={category.id}
                  categoryName={category.name}
                  categoryDescription={category.description}
                  items={category.items}
                  onAddToCart={openAddToCartModal}
                  categoryRef={(el) => {
                    categoryRefs.current[categoryElementId] = el;
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">No menu items available</p>
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
