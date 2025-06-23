"use client";

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import type { NestedMenuItem } from '@/utils/menuTypes';

interface RestaurantMenuProps {
  restaurantId: string;
  items: NestedMenuItem[];
}

export function RestaurantMenu({ restaurantId, items }: RestaurantMenuProps) {
  const { handleAddToCart } = useCart();

  const onAddToCart = (item: NestedMenuItem) => {
    handleAddToCart({
      itemId: item.id,
      itemName: item.name,
      itemPrice: item.price.amount,
      categoryName: item.category || 'Default',
      customizations: [],
      totalPrice: item.price.amount,
      restaurantId,
      imageUrl: item.imageUrl,
      dietaryTags: []
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          {item.imageUrl && (
            <div className="relative h-48 mb-4">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-gray-600">{item.description}</p>
          <p className="text-lg font-bold mt-2">${item.price.amount.toFixed(2)}</p>
          <Button
            onClick={() => onAddToCart(item)}
            className="w-full mt-4"
          >
            Add to Cart
          </Button>
        </Card>
      ))}
    </div>
  );
}
