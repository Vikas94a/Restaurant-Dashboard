'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import MenuEditor from '@/components/MenuEditor/MenuEditor';

export default function RestaurantMenu() {
  const params = useParams();
  const restaurantId = params.id as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <MenuEditor restaurantId={restaurantId} />
    </div>
  );
} 