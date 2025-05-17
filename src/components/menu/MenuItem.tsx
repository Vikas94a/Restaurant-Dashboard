import React from 'react';
import { MenuItemProps } from '@/types/menu';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export const MenuItem: React.FC<MenuItemProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
  return (
    <Card className="p-4 flex gap-4">
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover rounded-md"
        />
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
            <p className="text-lg font-bold mt-1">${item.price.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
            >
              <Edit size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleAvailability(item.id)}
            >
              {item.available ? <Eye size={18} /> : <EyeOff size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}; 