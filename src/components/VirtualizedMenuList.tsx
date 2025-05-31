import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { NestedMenuItem } from '@/utils/menuTypes';

interface MenuItemProps {
  item: NestedMenuItem;
  onAddToCart: (item: NestedMenuItem) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, onAddToCart }) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
          <div className="mt-2">
            {item.dietaryTags?.map((tag) => (
              <span
                key={tag}
                className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="ml-4 text-right">
          <p className="text-lg font-semibold">
            ${item.price.amount.toFixed(2)}
          </p>
          <button
            onClick={() => onAddToCart(item)}
            disabled={!item.isAvailable}
            className={`mt-2 px-4 py-2 rounded ${
              item.isAvailable
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {item.isAvailable ? 'Add to Cart' : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface VirtualizedMenuListProps {
  items: NestedMenuItem[];
  onAddToCart: (item: NestedMenuItem) => void;
  height: number;
  itemHeight: number;
}

const VirtualizedMenuList: React.FC<VirtualizedMenuListProps> = ({
  items,
  onAddToCart,
  height,
  itemHeight,
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MenuItem item={items[index]} onAddToCart={onAddToCart} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};

export default VirtualizedMenuList; 