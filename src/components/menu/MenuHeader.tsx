import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Category } from '@/utils/menuTypes';

interface MenuHeaderProps {
  restaurantName: string;
  onSearch: (query: string) => void;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ restaurantName, onSearch }) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <h1 className="text-3xl font-bold">{restaurantName} Menu</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          type="text"
          placeholder="Search menu items..."
          className="pl-10"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}; 