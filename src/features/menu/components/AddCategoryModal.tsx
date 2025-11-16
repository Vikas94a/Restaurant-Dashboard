/**
 * AddCategoryModal - Modal for creating a new category
 * Asks for category name and description before creating
 */

"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryName: string, categoryDescription: string) => void;
}

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
}: AddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.error('Kategorinavn er påkrevd');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(categoryName.trim(), categoryDescription.trim());
      // Reset form
      setCategoryName('');
      setCategoryDescription('');
      onClose();
      toast.success('Kategori opprettet');
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Kunne ikke opprette kategori');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setCategoryName('');
      setCategoryDescription('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
            <h2 className="text-xl font-bold text-gray-900">Opprett ny kategori</h2>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
              aria-label="Lukk"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-4">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorinavn *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && categoryName.trim()) {
                    handleSave();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="F.eks. Pizza, Burger, Drikke"
                autoFocus
                disabled={isSaving}
              />
            </div>

            {/* Category Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivelse (valgfritt)
              </label>
              <textarea
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="Beskriv kategorien..."
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-gray-200 bg-white">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={!categoryName.trim() || isSaving}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Oppretter...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
                  Opprett kategori
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

