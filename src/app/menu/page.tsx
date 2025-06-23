"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMenuEditor } from '@/hooks/useMenuEditor';
import VirtualizedMenuList from '@/components/VirtualizedMenuList';
import { NestedMenuItem, Item } from '@/utils/menuTypes';

export default function MenuPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  const { categories, loading, error } = useMenuEditor(restaurantId);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [listHeight, setListHeight] = useState(600); // Default height

  useEffect(() => {
    // Set the list height based on viewport height
    const updateHeight = () => {
      const vh = window.innerHeight;
      setListHeight(vh - 200); // Subtract header and category selector height
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const convertItemToNestedMenuItem = (item: Item): NestedMenuItem => {
    return {
      id: item.id || item.frontendId || '', // Ensure we always have an id
      name: item.name,
      description: item.description,
      price: {
        amount: item.price.amount,
        currency: item.price.currency
      },
      isAvailable: item.isAvailable ?? true,
      frontendId: item.frontendId,
      imageUrl: item.imageUrl,
      category: item.category,
      isPopular: item.isPopular,
      dietaryTags: item.dietaryTags,
      customizations: item.customizations,
      linkedReusableExtras: item.linkedReusableExtras,
      linkedReusableExtraIds: item.linkedReusableExtraIds,
      subItems: item.subItems?.map(convertItemToNestedMenuItem),
      itemType: item.itemType,
      isEditing: item.isEditing
    };
  };

  const handleAddToCart = (item: NestedMenuItem) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', item);
  };

  if (loading) {
    return <div className="p-4">Loading menu...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading menu: {error}</div>;
  }

  const currentCategory = categories.find(cat => cat.docId === selectedCategory);
  const menuItems = currentCategory?.items.map(convertItemToNestedMenuItem) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Menu</h1>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.docId}
              onClick={() => setSelectedCategory(category.docId!)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === category.docId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {category.categoryName}
            </button>
          ))}
        </div>
      </div>

      {selectedCategory ? (
        <div className="bg-white rounded-lg shadow">
          <VirtualizedMenuList
            items={menuItems}
            onAddToCart={handleAddToCart}
            height={listHeight}
            itemHeight={150} // Adjust based on your item height
          />
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Select a category to view menu items
        </div>
      )}
    </div>
  );
} 