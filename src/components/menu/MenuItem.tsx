import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Item } from '@/utils/menuTypes';

interface MenuItemProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => void;
  onToggleAvailability: (itemId: string) => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  item,                    // The individual menu item object (name, description, price, image, availability)
  onEdit,                  // Callback function to trigger edit action for this item
  onDelete,                // Callback function to trigger delete action for this item by id
  onToggleAvailability,    // Callback function to toggle item's availability status by id
}) => {
  const itemId = item.id || item.frontendId;
  
  if (!itemId) {
    console.warn('MenuItem is missing both id and frontendId:', item);
    return null;
  }

  return (
    <Card className="p-4 flex gap-4">
      {/* Image container with fixed size */}
      <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}            // Image URL of the menu item
            alt={item.name}             // Alt text for accessibility
            fill                        // Makes image fill the container
            className="object-cover rounded-md" // Styling: cover image and rounded corners
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <ImageIcon size={24} />
            <span className="text-xs mt-1">No image</span>
          </div>
        )}
      </div>

      {/* Main content area grows to fill available space */}
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            {/* Item name */}
            <h3 className="font-semibold">{item.name}</h3>
            {/* Item description in smaller gray text */}
            <p className="text-sm text-gray-600">{item.description}</p>
            {/* Item price formatted to 2 decimals */}
            <p className="text-lg font-bold mt-1">${item.price.amount.toFixed(2)}</p>
          </div>

          {/* Action buttons: Edit, Delete, Toggle Availability */}
          <div className="flex gap-2">
            {/* Edit button triggers onEdit callback with item data */}
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
              <Edit size={18} />
            </Button>

            {/* Delete button triggers onDelete callback with item id */}
            <Button variant="ghost" size="icon" onClick={() => onDelete(itemId)}>
              <Trash2 size={18} />
            </Button>

            {/* Toggle availability button toggles item availability state */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleAvailability(itemId)}
            >
              {/* Show open eye icon if available, closed eye if not */}
              {item.isAvailable ? <Eye size={18} /> : <EyeOff size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
