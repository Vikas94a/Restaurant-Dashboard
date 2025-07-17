"use client";

import React, { useState } from 'react';
import { ReusableExtraGroup, ReusableExtraChoice } from '@/utils/menuTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface ReusableExtrasManagerProps {
  reusableExtras: ReusableExtraGroup[];
  loadingExtras: boolean;
  onAddGroup: (groupData: Omit<ReusableExtraGroup, 'id'>) => Promise<string | null>; // Returns new group ID or null
  onUpdateGroup: (groupId: string, groupData: Partial<Omit<ReusableExtraGroup, 'id'>>) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  isCompact?: boolean;
}

// Simple deep copy function for this scope
function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const ReusableExtrasManager: React.FC<ReusableExtrasManagerProps> = ({
  reusableExtras,
  loadingExtras,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  isCompact = false,
}) => {
  const [editingGroup, setEditingGroup] = useState<ReusableExtraGroup | null>(null);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);

  const handleStartAddNewGroup = () => {
    setEditingGroup({
      id: '', // Temporary, will be set on save by backend/hook
      groupName: '',
      selectionType: 'single',
      choices: [],
    });
    setIsCreatingNewGroup(true);
  };

  const handleEditGroup = (group: ReusableExtraGroup) => {
    setEditingGroup(deepCopy(group)); // Edit a copy
    setIsCreatingNewGroup(false);
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setIsCreatingNewGroup(false);
  };

  const handleSaveGroup = async () => {
    if (!editingGroup) return;
    if (!editingGroup.groupName.trim()) {
      toast.error('Group name is required.');
      return;
    }

    try {
      if (isCreatingNewGroup) {
        const { id: _, ...groupData } = editingGroup;
        const newId = await onAddGroup(groupData);
        if (newId) {
          toast.success('New extra group added!');
        }
      } else {
        const { id, ...groupData } = editingGroup;
        await onUpdateGroup(id, groupData);
        toast.success('Extra group updated!');
      }
      setEditingGroup(null);
      setIsCreatingNewGroup(false);
    } catch (error) {
      toast.error('Failed to save extra group.');
    }
  };
  
  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this extra group? This might affect items using it.')) {
        try {
            await onDeleteGroup(groupId);
            toast.success('Extra group deleted.');
            if(editingGroup?.id === groupId) {
                setEditingGroup(null);
                setIsCreatingNewGroup(false);
            }
        } catch (error) {
            toast.error('Failed to delete extra group.');
        }
    }
  };

  // --- Choice Management Functions (to be implemented within the editingGroup state) ---
  const handleAddChoiceToEditingGroup = () => {
    if (!editingGroup) return;
    const newChoice: ReusableExtraChoice = { id: `choice-${Date.now()}`, name: '', price: 0 };
    setEditingGroup({
      ...editingGroup,
      choices: [...editingGroup.choices, newChoice],
    });
  };

  const handleEditingGroupChoiceChange = (choiceIndex: number, field: keyof ReusableExtraChoice, value: string | number) => {
    if (!editingGroup) return;
    const updatedChoices = [...editingGroup.choices];
    const targetChoice = { ...updatedChoices[choiceIndex] };
    if (field === 'price') {
        targetChoice[field] = parseFloat(value as string) || 0;
    } else {
        targetChoice[field] = value as string;
    }
    updatedChoices[choiceIndex] = targetChoice;
    setEditingGroup({ ...editingGroup, choices: updatedChoices });
  };

  const handleDeleteChoiceFromEditingGroup = (choiceIndex: number) => {
    if (!editingGroup) return;
    setEditingGroup({
      ...editingGroup,
      choices: editingGroup.choices.filter((choice) => editingGroup.choices.indexOf(choice) !== choiceIndex),
    });
  };
  // --- End Choice Management --- 

  if (loadingExtras) {
    return (
      <div className="flex justify-center items-center py-8">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/>
      </div>
    );
  }

  return (
    <div className={isCompact ? "space-y-3" : "space-y-6"}>
      {!editingGroup && !loadingExtras && (
        <button 
          onClick={handleStartAddNewGroup}
          className={`w-full px-4 py-2.5 text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors flex items-center justify-center shadow-sm ${isCompact ? 'text-sm' : 'text-base'}`}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2"/> Add New Extra Group
        </button>
      )}

      {editingGroup ? (
        <div className={`p-4 border rounded-lg shadow-lg bg-white ${isCompact ? 'text-sm' : ''}`}>
          <h3 className={`font-semibold text-gray-800 mb-3 ${isCompact ? 'text-lg' : 'text-xl'}`}>
            {isCreatingNewGroup ? 'Create New Extra Group' : `Edit: ${editingGroup.groupName || 'Group'}`}
          </h3>
          <div className="mb-3">
            <label htmlFor="groupName" className={`block font-medium text-gray-700 mb-1 ${isCompact ? 'text-xs' : 'text-sm'}`}>Group Name</label>
            <input 
              type="text"
              id="groupName"
              placeholder="e.g., Drink Options, Sauces"
              value={editingGroup.groupName}
              onChange={(e) => setEditingGroup({...editingGroup, groupName: e.target.value})}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary ${isCompact ? 'text-sm' : ''}`}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="selectionType" className={`block font-medium text-gray-700 mb-1 ${isCompact ? 'text-xs' : 'text-sm'}`}>Selection Type</label>
            <select 
              id="selectionType"
              value={editingGroup.selectionType}
              onChange={(e) => setEditingGroup({...editingGroup, selectionType: e.target.value as 'single' | 'multiple'})}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary ${isCompact ? 'text-sm' : ''}`}
            >
              <option value="single">Single Choice (e.g., Size)</option>
              <option value="multiple">Multiple Choices (e.g., Toppings)</option>
            </select>
          </div>

          <h4 className={`font-semibold text-gray-700 mb-2 mt-4 ${isCompact ? 'text-base' : 'text-md'}`}>Choices:</h4>
          {editingGroup.choices.map((choice: ReusableExtraChoice, choiceIndex: number) => (
            <div key={choice.id || choiceIndex} className={`flex items-center space-x-2 mb-2 p-2 bg-white rounded border ${isCompact ? 'text-xs' : ''}`}>
              <input
                type="text"
                placeholder="Choice Name (e.g., Coke, Ketchup)"
                value={choice.name}
                onChange={(e) => handleEditingGroupChoiceChange(choiceIndex, 'name', e.target.value)}
                className={`flex-grow px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary ${isCompact ? 'text-xs' : 'text-sm'}`}
              />
              <input
                type="number"
                placeholder="Price"
                value={choice.price}
                onChange={(e) => handleEditingGroupChoiceChange(choiceIndex, 'price', e.target.value)}
                className={`w-20 flex-shrink-0 px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary ${isCompact ? 'text-xs' : 'text-sm'}`}
                step="0.01"
              />
              <button onClick={() => handleDeleteChoiceFromEditingGroup(choiceIndex)} className="text-red-500 hover:text-red-700 p-1.5">
                <FontAwesomeIcon icon={faTrash} size={isCompact ? 'xs' : 'sm'}/>
              </button>
            </div>
          ))}
          <button 
            onClick={handleAddChoiceToEditingGroup}
            className={`w-full mt-2 px-3 py-2 text-primary border border-primary rounded hover:bg-primary-lightest focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors flex items-center justify-center ${isCompact ? 'text-xs' : 'text-sm'}`}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-1"/> Add Choice
          </button>

          <div className="flex justify-end space-x-2 mt-4">
            <button 
              onClick={handleCancelEdit}
              className={`px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors flex items-center ${isCompact ? 'text-xs' : 'text-sm'}`}
            >
              <FontAwesomeIcon icon={faTimes} className="mr-1"/> Cancel
            </button>
            <button 
              onClick={handleSaveGroup}
              className={`px-4 py-2 text-white bg-primary rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors flex items-center ${isCompact ? 'text-xs' : 'text-sm'}`}
            >
              <FontAwesomeIcon icon={faSave} className="mr-1"/> Save Group
            </button>
          </div>
        </div>
      ) : (
        <div className={`space-y-3 ${isCompact ? 'text-sm' : ''}`}>
          {reusableExtras.map((group) => (
            <div key={group.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className={`font-semibold text-gray-800 ${isCompact ? 'text-base' : 'text-lg'}`}>{group.groupName}</h3>
                  <p className={`text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    {group.selectionType === 'single' ? 'Single Choice' : 'Multiple Choices'} | {group.choices.length} options
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditGroup(group)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} size={isCompact ? 'sm' : 'lg'}/>
                  </button>
                  <button 
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} size={isCompact ? 'sm' : 'lg'}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReusableExtrasManager;