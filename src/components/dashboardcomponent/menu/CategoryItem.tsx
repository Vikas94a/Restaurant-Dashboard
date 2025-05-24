"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes, 
  faPlus, 
  faChevronDown, 
  faChevronUp,
  faUtensils,
  faPizzaSlice,
  faBurger,
  faMugHot,
  faIceCream,
  faWineGlass
} from '@fortawesome/free-solid-svg-icons';
import { Category, NestedMenuItem, CustomizationGroup, ReusableExtraGroup } from '@/hooks/useMenuEditor';
import Image from 'next/image';
import ItemCustomizationModal from './ItemCustomizationModal';

const CHARACTER_LIMITS = {
  CATEGORY_NAME: 80,
  CATEGORY_DESCRIPTION: 150,
  ITEM_NAME: 100,
  ITEM_DESCRIPTION: 300,
};

interface CategoryItemProps {
  category: Category;
  catIndex: number;
  loading: boolean;
  handleCategoryChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleItemChange: (catIndex: number, itemIndex: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleAddItem: (catIndex: number) => void;
  toggleEditCategory: (index: number, isEditing: boolean) => void;
  handleSaveCategory: (catIndex: number) => Promise<void>;
  handleDeleteCategory: (catIndex: number) => void;
  handleDeleteItem: (catIndex: number, itemIndex: number) => void;
  updateItemCustomizations: (itemFrontendId: string | undefined, customizations: CustomizationGroup[]) => void;
  reusableExtras: ReusableExtraGroup[];
  updateItemLinkedExtras: (itemFrontendId: string | undefined, linkedExtraGroupIds: string[]) => void;
}

export default function CategoryItem({
  category,
  catIndex,
  loading,
  handleCategoryChange,
  handleItemChange,
  handleAddItem,
  toggleEditCategory,
  handleSaveCategory,
  handleDeleteCategory,
  handleDeleteItem,
  updateItemCustomizations,
  reusableExtras,
  updateItemLinkedExtras
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<NestedMenuItem | null>(null);

  useEffect(() => {
    if (!!category.isEditing) {
      setIsExpanded(true);
    }
  }, [category.isEditing]);

  // Get appropriate icon for category based on name
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('pizza') || name.includes('flat')) return faPizzaSlice;
    if (name.includes('burger') || name.includes('sandwich')) return faBurger;
    if (name.includes('coffee') || name.includes('tea') || name.includes('beverage')) return faMugHot;
    if (name.includes('dessert') || name.includes('ice')) return faIceCream;
    if (name.includes('wine') || name.includes('drink') || name.includes('bar')) return faWineGlass;
    return faUtensils; // Default
  };

  // Generate background color based on category name for visual distinction
  const getCategoryColor = (categoryName: string, isEditing: boolean) => {
    if (isEditing) return 'bg-gray-50'; // Default for editing mode
    
    const name = categoryName.toLowerCase();
    if (name.includes('pizza') || name.includes('italian')) return 'bg-red-50 border-l-4 border-red-400';
    if (name.includes('burger') || name.includes('american')) return 'bg-amber-50 border-l-4 border-amber-400';
    if (name.includes('salad') || name.includes('vegan') || name.includes('vegetarian')) return 'bg-green-50 border-l-4 border-green-400';
    if (name.includes('dessert') || name.includes('sweet')) return 'bg-pink-50 border-l-4 border-pink-400';
    if (name.includes('drink') || name.includes('beverage')) return 'bg-blue-50 border-l-4 border-blue-400';
    return 'bg-white border-l-4 border-orange-400'; // Default
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    if (!category.isEditing) {
      setIsExpanded(prev => !prev);
    }
  };

  const handleOpenCustomizationModal = (item: NestedMenuItem) => {
    setSelectedItemForCustomization(item);
    setIsCustomizationModalOpen(true);
  };

  const handleCloseCustomizationModal = () => {
    setSelectedItemForCustomization(null);
    setIsCustomizationModalOpen(false);
  };

  const handleSaveCustomizations = (itemId: string | undefined, customizations: CustomizationGroup[]) => {
    if (!itemId) return;
    updateItemCustomizations(itemId, customizations);
    handleCloseCustomizationModal();
  };

  return (
    <>
      <div key={category.docId || category.frontendId} className="mb-4 bg-white rounded-md shadow overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-200">
        <div
          className={`px-4 py-3 ${getCategoryColor(category.categoryName, !!category.isEditing)} flex justify-between items-center ${!category.isEditing ? 'cursor-pointer hover:bg-opacity-80' : ''} transition-colors duration-150`}
          onClick={handleCategoryClick} // Preserved original direct usage
        >
          {category.isEditing ? (
            <div className="flex-1 mr-3 space-y-3"> {/* Added space-y-3 for better spacing between input groups */}
              <div>
                <input
                  type="text"
                  name="categoryName"
                  value={category.categoryName}
                  onChange={(e) => handleCategoryChange(catIndex, e)}
                  className="text-lg font-semibold px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full outline-none shadow-sm"
                  placeholder="Category Name"
                  required
                  maxLength={CHARACTER_LIMITS.CATEGORY_NAME}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="text-xs text-gray-500 mt-1.5 text-right pr-1">
                  {category.categoryName.length} / {CHARACTER_LIMITS.CATEGORY_NAME}
                </div>
              </div>
              <div>
                <textarea
                  name="categoryDescription"
                  value={category.categoryDescription || ""}
                  onChange={(e) => handleCategoryChange(catIndex, e)}
                  className="text-sm text-gray-700 px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary w-full outline-none resize-none shadow-sm"
                  placeholder="Category Description (Optional)"
                  rows={2}
                  maxLength={CHARACTER_LIMITS.CATEGORY_DESCRIPTION}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="text-xs text-gray-500 mt-1.5 text-right pr-1">
                  {(category.categoryDescription || '').length} / {CHARACTER_LIMITS.CATEGORY_DESCRIPTION}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center min-w-0"> {/* Added min-w-0 for better truncation handling */}
              <div className="flex-shrink-0 mr-3 w-8 h-8 bg-primary bg-opacity-10 rounded flex items-center justify-center text-primary">
                <FontAwesomeIcon icon={getCategoryIcon(category.categoryName)} className="h-4 w-4" />
              </div>
              <div className="flex-grow min-w-0"> 
                <h3 className="text-base font-bold text-gray-800 truncate" title={category.categoryName || "Unnamed Category"}>
                  {category.categoryName || "Unnamed Category"}
                </h3>
                {category.categoryDescription && (
                  <p className="text-xs text-gray-600 truncate" title={category.categoryDescription}>
                    {category.categoryDescription}
                  </p>
                )}
              </div>
              {!category.isEditing && (
                <div className="ml-2 flex-shrink-0 flex items-center bg-gray-50 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                  <span className="font-medium text-xs">{category.items.length}</span>
                  <span className="ml-0.5 text-xs">item{category.items.length === 1 ? '' : 's'}</span>
                  <FontAwesomeIcon
                    icon={isExpanded ? faChevronUp : faChevronDown}
                    className="ml-1.5 text-gray-400 transition-transform text-xs"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 pl-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {category.isEditing ? (
              <>
                <button
                  onClick={() => handleSaveCategory(catIndex)}
                  className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-1 transition-colors duration-200 flex items-center shadow-sm disabled:opacity-75"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSave} className="mr-1.5 h-5 w-5" />
                  Save
                </button>
                {category.docId && (
                  <button
                    onClick={() => toggleEditCategory(catIndex, false)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
                    disabled={loading}
                    title="Cancel"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEditCategory(catIndex, true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
                  disabled={loading}
                  title="Edit Category"
                >
                  <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(catIndex);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
                  disabled={loading}
                  title="Delete Category"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Collapsible content section - Preserving original max-h logic */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            {!category.isEditing && category.items.length > 0 && (
              <div className="mb-3 pb-2 border-b border-gray-200 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="h-3 w-1 bg-primary rounded mr-2"></span>
                  Menu Items
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEditCategory(catIndex, true);
                  }}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-1 h-3 w-3" />
                  Edit Items
                </button>
              </div>
            )}

            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {category.items.map((item, itemIndex) => (
                <div
                  key={item.frontendId || `${catIndex}-${itemIndex}`}
                  className={`bg-white rounded border flex flex-col shadow-sm hover:shadow transition-shadow duration-200 overflow-hidden ${category.isEditing ? 'border-primary' : 'border-gray-200'}`}
                >
                  {category.isEditing ? (
                    <div className="p-3 space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-0.5">Item Name*</label>
                        <input
                          type="text"
                          name="itemName"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(catIndex, itemIndex, e)}
                          className="text-sm font-medium px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary w-full outline-none"
                          placeholder="Item Name"
                          required
                          maxLength={CHARACTER_LIMITS.ITEM_NAME}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="text-xs text-gray-500 mt-0.5 text-right">
                          {(item.itemName || '').length} / {CHARACTER_LIMITS.ITEM_NAME}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-0.5">Description</label>
                        <textarea
                          name="itemDescription"
                          value={item.itemDescription || ''}
                          onChange={(e) => handleItemChange(catIndex, itemIndex, e)}
                          className="text-xs text-gray-700 px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary w-full outline-none resize-none"
                          placeholder="Item Description (Optional)"
                          rows={2}
                          maxLength={CHARACTER_LIMITS.ITEM_DESCRIPTION}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="text-xs text-gray-500 mt-0.5 text-right">
                          {(item.itemDescription || '').length} / {CHARACTER_LIMITS.ITEM_DESCRIPTION}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-0.5">Price ($)*</label>
                        <input
                          type="number"
                          name="itemPrice"
                          value={item.itemPrice}
                          onChange={(e) => handleItemChange(catIndex, itemIndex, e)}
                          className="text-sm px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary w-full outline-none"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>

                      {/* ... (existing image upload code if any) ... */}

                      {category.isEditing && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenCustomizationModal(item)}
                            className="w-full px-2 py-1.5 text-xs font-medium text-primary-dark border border-primary-light rounded hover:bg-primary-light hover:text-primary-dark focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-150"
                          >
                            <FontAwesomeIcon icon={faPlus} className="mr-1.5" size="xs" /> Manage Item Options
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleDeleteItem(catIndex, itemIndex)}
                          className="flex items-center text-red-600 hover:text-red-700 text-xs font-medium p-1 hover:bg-red-50 rounded transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-75"
                          disabled={loading}
                          title="Remove Item"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1 h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 flex-grow"> 
                        <h5 className="text-sm font-semibold text-gray-800 mb-1 truncate" title={item.itemName || 'Unnamed Item'}>
                          {item.itemName || 'Unnamed Item'}
                        </h5>
                        {item.itemDescription ? (
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2 min-h-[2em]" title={item.itemDescription}> 
                            {item.itemDescription}
                          </p>
                        ) : (
                          <div className="min-h-[1em] mb-1"></div> 
                        )}
                      </div>
                      <div className="mt-auto p-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex items-center text-gray-500">
                          <span className="text-xs">Price</span>
                        </div>
                        <div className="text-primary font-bold text-sm">
                          ${item.itemPrice !== undefined && item.itemPrice !== null ? Number(item.itemPrice).toFixed(2) : '0.00'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {category.items.length === 0 && !category.isEditing && isExpanded && (
                <div className="col-span-full text-center py-6 px-4 bg-white rounded border border-dashed border-gray-300">
                  <FontAwesomeIcon icon={faUtensils} className="h-6 w-6 text-gray-300 mb-2" />
                  <p className="text-gray-600 text-sm mb-1">No items in this category yet.</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEditCategory(catIndex, true);
                    }}
                    className="mt-2 text-xs text-primary hover:text-primary-dark font-medium py-1 px-2 rounded hover:bg-primary-lightest transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    Add First Item
                  </button>
                </div>
              )}
              {category.items.length === 0 && category.isEditing && (
                <div className="col-span-full text-center py-5 px-4 bg-gray-50 rounded border border-dashed border-gray-300">
                  <FontAwesomeIcon icon={faUtensils} className="h-6 w-6 text-gray-300 mb-2" />
                  <p className="text-gray-600 text-sm mb-1">This category is empty.</p>
                  <p className="text-xs text-gray-500">Click "Add New Item" to get started.</p>
                </div>
              )}


              {category.isEditing && (
                <div 
                    className="col-span-1 md:col-span-1 lg:col-span-1 border border-dashed border-gray-300 bg-white rounded p-3 min-h-[120px] flex flex-col items-center justify-center text-center hover:border-primary hover:bg-gray-50 transition-all duration-200 cursor-pointer group" 
                    onClick={() => handleAddItem(catIndex)}
                    title="Add a new item to this category"
                >
                  <div className="p-2 bg-primary bg-opacity-10 rounded mb-2 transition-transform duration-200 group-hover:scale-110">
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-primary-dark">Add New Item</p>
                  <p className="text-xs text-gray-500 mt-0.5">to '{category.categoryName || 'this category'}'</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedItemForCustomization && (
        <ItemCustomizationModal
          isOpen={isCustomizationModalOpen}
          onClose={handleCloseCustomizationModal}
          item={selectedItemForCustomization}
          reusableExtras={reusableExtras}
          onSaveLinkedExtras={(itemId, linkedIds) => {
            updateItemLinkedExtras(itemId, linkedIds);
            handleCloseCustomizationModal();
          }}
        />
      )}
    </>  );
}
