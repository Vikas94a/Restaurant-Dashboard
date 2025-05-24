"use client";

import React, { useState, useEffect } from 'react';
import { NestedMenuItem, CustomizationGroup, CustomizationChoice, ReusableExtraGroup } from '@/hooks/useMenuEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faSpinner, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface ItemCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NestedMenuItem | null;
  reusableExtras: ReusableExtraGroup[];
  onSaveLinkedExtras: (itemFrontendId: string | undefined, linkedIds: string[]) => void;
}

function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepCopy(item)) as any;
  }
  const copiedObject: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copiedObject[key] = deepCopy(obj[key]);
    }
  }
  return copiedObject;
}

const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({
  isOpen,
  onClose,
  item,
  reusableExtras,
  onSaveLinkedExtras
}) => {
  const [selectedReusableExtraGroupIds, setSelectedReusableExtraGroupIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item && item.linkedReusableExtraIds) {
      setSelectedReusableExtraGroupIds([...item.linkedReusableExtraIds]);
    } else {
      setSelectedReusableExtraGroupIds([]);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  // Add this to handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleToggleReusableExtra = (groupId: string) => {
    setSelectedReusableExtraGroupIds(prevSelectedIds =>
      prevSelectedIds.includes(groupId)
        ? prevSelectedIds.filter(id => id !== groupId)
        : [...prevSelectedIds, groupId]
    );
  };

  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      onSaveLinkedExtras(item.frontendId, selectedReusableExtraGroupIds);
      toast.success(`'${item.itemName}' updated with selected extras.`);
      onClose();
    } catch (error) {
      console.error('Error saving linked extras:', error);
      toast.error('Failed to save linked extras.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] transition-opacity duration-200"
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-200 ease-out"
        style={{
          transform: isOpen ? 'scale(1)' : 'scale(0.95)',
          opacity: isOpen ? 1 : 0,
          maxHeight: 'calc(100vh - 2rem)'
        }}
      >
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            Link Extras for <span className="text-primary">{item.itemName}</span>
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 -mr-2"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow p-6 pt-4 space-y-4 custom-scrollbar">
          {reusableExtras.length === 0 ? (
            <div className="text-center py-8 px-4 bg-gray-100 rounded-lg">
                <FontAwesomeIcon icon={faInfoCircle} className="text-3xl text-gray-400 mb-3"/>
                <p className="text-gray-600 font-medium">No Reusable Extras Defined</p>
                <p className="text-sm text-gray-500 mt-1">Go to 'Manage Reusable Item Extras' to create some first.</p>
            </div>
          ) : (
            reusableExtras.map(group => (
              <div 
                key={group.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out flex items-center justify-between hover:shadow-md
                            ${selectedReusableExtraGroupIds.includes(group.id) 
                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                                : 'bg-white border-gray-200 hover:border-gray-300'}`}
                onClick={() => handleToggleReusableExtra(group.id)}
              >
                <div>
                    <h4 className={`font-semibold ${selectedReusableExtraGroupIds.includes(group.id) ? 'text-primary-darker' : 'text-gray-700'}`}>
                        {group.groupName}
                    </h4>
                    <p className={`text-xs ${selectedReusableExtraGroupIds.includes(group.id) ? 'text-primary-dark' : 'text-gray-500'}`}>
                        Type: {group.selectionType} | Choices: {group.choices.length}
                    </p>
                </div>
                <input 
                    type="checkbox"
                    checked={selectedReusableExtraGroupIds.includes(group.id)}
                    onChange={() => handleToggleReusableExtra(group.id)} 
                    className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary-dark transition-colors cursor-pointer"
                />
              </div>
            ))
          )}
        </div>

        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2 h-4 w-4" /> 
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || reusableExtras.length === 0}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center ${
                isSaving || reusableExtras.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-dark focus:ring-primary-dark'
              }`}
            >
              {isSaving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2 h-4 w-4" />
                  Save Linked Extras
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCustomizationModal;
