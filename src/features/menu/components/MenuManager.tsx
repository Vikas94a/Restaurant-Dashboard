/**
 * MenuManager - Main orchestrator for menu management
 * Implements Foodora-style two-pane layout with right slide-in edit modal
 */

"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useMenuEditor } from '@/hooks/useMenuEditor';
import { Category, NestedMenuItem } from '@/utils/menuTypes';
import MenuSidebar from './MenuSidebar';
import CategoryList from './CategoryList';
import EditProductModal from './EditProductModal';
import AddCategoryModal from './AddCategoryModal';
import AddProductModal from './AddProductModal';
import { useAvailability } from '../hooks/useAvailability';
import { AvailabilityState } from '../types/availability';
import { toast } from 'sonner';
import ReusableExtrasManager from './ReusableExtrasManager';

interface MenuManagerProps {
  restaurantId: string;
}

export default function MenuManager({ restaurantId }: MenuManagerProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const {
    categories,
    setCategories,
    loading,
    loadingExtras,
    reusableExtras,
    handleAddCategory,
    handleAddItem,
    handleDeleteItem,
    handleItemChange,
    handleSaveCategory,
    updateItemLinkedExtras,
    addReusableExtraGroup,
    updateReusableExtraGroup,
    deleteReusableExtraGroup,
    error,
    setError,
  } = useMenuEditor(restaurantId);

  // Get selected category
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return (
      categories.find(
        (cat) => (cat.docId || cat.frontendId) === selectedCategoryId
      ) || null
    );
  }, [categories, selectedCategoryId]);

  // Get selected product
  const selectedProduct = useMemo(() => {
    if (!selectedProductId || !selectedCategory) return null;
    return (
      selectedCategory.items?.find(
        (item) => (item.id || item.frontendId) === selectedProductId
      ) || null
    );
  }, [selectedProductId, selectedCategory]);

  // Auto-select first category if none selected
  React.useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      const firstCategory = categories[0];
      setSelectedCategoryId(firstCategory.docId || firstCategory.frontendId || null);
    }
  }, [categories, selectedCategoryId]);

  // Availability hook - updates state directly with optimistic UI
  const { updateItemAvailability } = useAvailability({
    restaurantId,
    categories,
    setCategories,
  });

  // Handle category selection
  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedProductId(null);
    setIsEditModalOpen(false);
  }, []);

  // Handle product selection
  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setIsEditModalOpen(true);
  }, []);

  // Handle open add category modal
  const handleOpenAddCategory = useCallback(() => {
    setIsAddCategoryModalOpen(true);
  }, []);

  // Handle save new category
  const handleSaveNewCategory = useCallback(async (categoryName: string, categoryDescription: string) => {
    // Create category with provided data
    const newCategory: Category = {
      categoryName,
      categoryDescription,
      items: [],
      isEditing: false,
      frontendId: `temp-${Date.now()}`,
    };
    
    // Add to local state
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    // Find the index and save to Firebase
    const categoryIndex = updatedCategories.length - 1;
    
    try {
      await handleSaveCategory(categoryIndex);
      
      // After saving, get the updated category and select it
      setCategories(current => {
        const savedCategory = current[categoryIndex];
        if (savedCategory) {
          const categoryId = savedCategory.docId || savedCategory.frontendId || '';
          if (categoryId) {
            setSelectedCategoryId(categoryId);
          }
        }
        return current;
      });
    } catch (error) {
      // Rollback on error
      setCategories(categories);
      throw error;
    }
  }, [categories, handleSaveCategory, setCategories]);

  // Handle open add product modal
  const handleOpenAddProduct = useCallback(() => {
    if (!selectedCategoryId) {
      toast.error('Velg en kategori først');
      return;
    }
    setIsAddProductModalOpen(true);
  }, [selectedCategoryId]);

  // Handle save new product
  const handleSaveNewProduct = useCallback(async (productData: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
  }) => {
    if (!selectedCategoryId) {
      toast.error('Kunne ikke finne kategori');
      return;
    }

    const categoryIndex = categories.findIndex(
      (cat) => (cat.docId || cat.frontendId) === selectedCategoryId
    );

    if (categoryIndex === -1) {
      toast.error('Kunne ikke finne kategori');
      return;
    }

    try {
      // Create new item with provided data
      const newItem: NestedMenuItem = {
        id: `new-item-${Date.now()}-${categoryIndex}`,
        name: productData.name,
        description: productData.description,
        price: { amount: productData.price, currency: 'NOK' },
        imageUrl: productData.imageUrl || '',
        isAvailable: true,
        availability: {
          status: 'available',
          until: null,
        },
      };

      // Add to local state
      const updatedCategories = [...categories];
      if (!updatedCategories[categoryIndex].items) {
        updatedCategories[categoryIndex].items = [];
      }
      updatedCategories[categoryIndex].items.push(newItem);
      setCategories(updatedCategories);

      // Save category to Firebase
      await handleSaveCategory(categoryIndex);
      
      toast.success('Produkt opprettet');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Kunne ikke opprette produkt');
      throw error;
    }
  }, [selectedCategoryId, categories, handleSaveCategory, setCategories]);

  // Handle delete product
  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      if (!selectedCategoryId) return;

      const categoryIndex = categories.findIndex(
        (cat) => (cat.docId || cat.frontendId) === selectedCategoryId
      );

      if (categoryIndex === -1) return;

      const itemIndex = selectedCategory?.items?.findIndex(
        (item) => (item.id || item.frontendId) === productId
      );

      if (itemIndex === undefined || itemIndex === -1) return;

      if (window.confirm('Er du sikker på at du vil slette dette produktet?')) {
        try {
          await handleDeleteItem(categoryIndex, itemIndex);
          toast.success('Produkt slettet');
          if (selectedProductId === productId) {
            setSelectedProductId(null);
            setIsEditModalOpen(false);
          }
        } catch (error) {
          console.error('Failed to delete product:', error);
          toast.error('Kunne ikke slette produkt');
        }
      }
    },
    [selectedCategoryId, selectedCategory, selectedProductId, categories, handleDeleteItem]
  );

  // Handle save product changes
  const handleSaveProduct = useCallback(
    async (productId: string, updates: Partial<NestedMenuItem>) => {
      if (!selectedCategoryId) return;

      const categoryIndex = categories.findIndex(
        (cat) => (cat.docId || cat.frontendId) === selectedCategoryId
      );

      if (categoryIndex === -1) return;

      const itemIndex = selectedCategory?.items?.findIndex(
        (item) => (item.id || item.frontendId) === productId
      );

      if (itemIndex === undefined || itemIndex === -1) return;

      try {
        // Update individual fields
        if (updates.name !== undefined) {
          await handleItemChange(categoryIndex, itemIndex, 'name', updates.name);
        }
        if (updates.description !== undefined) {
          await handleItemChange(categoryIndex, itemIndex, 'description', updates.description);
        }
        if (updates.price?.amount !== undefined) {
          await handleItemChange(categoryIndex, itemIndex, 'priceAmount', updates.price.amount);
        }
        if (updates.imageUrl !== undefined) {
          await handleItemChange(categoryIndex, itemIndex, 'imageUrl', updates.imageUrl);
        }
        if (updates.isPopular !== undefined) {
          await handleItemChange(categoryIndex, itemIndex, 'isPopular', updates.isPopular);
        }
        if (updates.dietaryTags !== undefined) {
          await handleItemChange(categoryIndex, itemIndex, 'dietaryTags', updates.dietaryTags);
        }

        // Update linked extras
        if (updates.linkedReusableExtraIds !== undefined) {
          const item = selectedCategory?.items?.[itemIndex];
          if (item) {
            const itemId = item.id || item.frontendId || '';
            if (itemId) {
              await updateItemLinkedExtras(itemId, updates.linkedReusableExtraIds);
            }
          }
        }

        toast.success('Produkt oppdatert');
      } catch (error) {
        console.error('Failed to save product:', error);
        toast.error('Kunne ikke lagre produkt');
        throw error;
      }
    },
    [selectedCategoryId, selectedCategory, categories, handleItemChange, updateItemLinkedExtras]
  );

  // Handle availability change
  const handleAvailabilityChange = useCallback(
    async (productId: string, availability: AvailabilityState) => {
      try {
        await updateItemAvailability(productId, availability);
      } catch (error) {
        console.error('Failed to update availability:', error);
        // Error is already handled in the hook
      }
    },
    [updateItemAvailability]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Reusable Extras Section - Collapsible Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <details className="group">
          <summary className="cursor-pointer p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <h3 className="text-sm font-semibold text-gray-900">
                Alternativgrupper (Reusable Options)
              </h3>
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {reusableExtras.length}
              </span>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 transform transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="p-4 border-t border-gray-200 bg-gray-50 max-h-96 overflow-y-auto">
            <ReusableExtrasManager
              reusableExtras={reusableExtras}
              loadingExtras={loadingExtras}
              onAddGroup={addReusableExtraGroup}
              onUpdateGroup={updateReusableExtraGroup}
              onDeleteGroup={deleteReusableExtraGroup}
              isCompact={true}
            />
          </div>
        </details>
      </div>

      {/* Main Layout - Sidebar + Category List with unified scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="flex">
          {/* Left Sidebar */}
        <MenuSidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          onAddCategory={handleOpenAddCategory}
          searchQuery={sidebarSearchQuery}
          onSearchChange={setSidebarSearchQuery}
          isLoading={loading}
        />

          {/* Middle - Category List */}
        <CategoryList
          category={selectedCategory}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
          onAddProduct={handleOpenAddProduct}
          onProductChange={() => {}} // Handled in modal
          onDeleteProduct={handleDeleteProduct}
          onAvailabilityChange={handleAvailabilityChange}
          searchQuery={categorySearchQuery}
          onSearchChange={setCategorySearchQuery}
          isLoading={loading}
        />
        </div>
      </div>

      {/* Right - Edit Modal (slides in) */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProductId(null);
        }}
        product={selectedProduct}
        reusableExtras={reusableExtras}
        onSave={handleSaveProduct}
        onAvailabilityChange={handleAvailabilityChange}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onSave={handleSaveNewCategory}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSave={handleSaveNewProduct}
      />
    </div>
  );
}

