"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faPlus, faUtensils } from '@fortawesome/free-solid-svg-icons';
import { useMenuEditor } from '@/hooks/useMenuEditor';
import CategoryItem from './menu/CategoryItem';
import ConfirmationDialog from './menu/ConfirmationDialog';
import ReusableExtrasManager from './menu/ReusableExtrasManager';

interface MenuEditorProps {
  restaurantId: string;
}

export default function MenuEditor({ restaurantId }: MenuEditorProps) {
  // Use our custom hook to manage all state and logic
  const {
    categories,
    loading,
    confirmDialog,
    setConfirmDialog,
    handleCategoryChange,
    handleItemChange,
    handleAddCategory,
    handleAddItem,
    toggleEditCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleDeleteItem,
    updateItemCustomizations,
    reusableExtras,
    loadingExtras,
    addReusableExtraGroup,
    updateReusableExtraGroup,
    deleteReusableExtraGroup,
    updateItemLinkedExtras,
  } = useMenuEditor(restaurantId);

  return (
    <div className="relative bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-sm p-6 sm:p-8">
    {/* Loading overlay */}
    {loading && (
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )}

    {/* Confirmation Dialog */}
    <ConfirmationDialog
      isOpen={confirmDialog.isOpen}
      title={confirmDialog.title}
      message={confirmDialog.message}
      onConfirm={confirmDialog.onConfirm}
      onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
    />

    {/* Menu Editor Header & Content */}
    <section className="mb-10">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="mb-4 md:mb-0">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <span className="bg-primary text-white p-3 rounded-lg mr-4 shadow">
              <FontAwesomeIcon icon={faUtensils} className="h-6 w-6" />
            </span>
            Menu Editor
          </h2>
          <p className="text-gray-600 mt-2 ml-1 md:ml-0">Organize your restaurant's offerings with categories and items.</p>
        </div>
        <button
          onClick={handleAddCategory}
          className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50 transition-colors duration-200 flex items-center self-start md:self-center">
          <FontAwesomeIcon icon={faPlus} className="mr-2 h-5 w-5" />
          Add Category
        </button>
      </header>

      {/* Main content: Categories or Empty State */}
      {categories.length === 0 && !loading ? (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-lg border border-dashed border-gray-300">
          <div className="inline-block p-5 bg-gray-100 rounded-full mb-6 shadow">
            <FontAwesomeIcon icon={faUtensils} className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">Your Menu is Empty</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Get started by adding a category. For example: "Appetizers", "Main Courses", or "Drinks".
          </p>
          <button
            onClick={handleAddCategory}
            className="px-7 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50 transition-colors duration-200 flex items-center mx-auto">
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-5 w-5" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="space-y-8"> {/* Increased spacing for better separation */}
          {categories.map((category, catIndex) => (
            <CategoryItem
              key={category.docId || category.frontendId}
              category={category}
              catIndex={catIndex}
              loading={loading} // This loading is the general page loading. Consider if CategoryItem needs its own fine-grained loading.
              handleCategoryChange={handleCategoryChange}
              handleItemChange={handleItemChange}
              handleAddItem={handleAddItem}
              toggleEditCategory={toggleEditCategory}
              handleSaveCategory={handleSaveCategory}
              handleDeleteCategory={handleDeleteCategory}
              handleDeleteItem={handleDeleteItem}
              updateItemCustomizations={updateItemCustomizations}
              reusableExtras={reusableExtras}
              updateItemLinkedExtras={updateItemLinkedExtras}
            />
          ))}
        </div>
      )}
    </section>

    {/* Reusable Extras Manager Section */}
    <section className="pt-10 border-t border-gray-200">
       <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="bg-gray-700 text-white p-3 rounded-lg mr-4 shadow"> {/* Using a different background for distinction */}
              <FontAwesomeIcon icon={faBoxesStacked} className="h-5 w-5" /> {/* Changed icon */}
            </span>
            Reusable Extras Manager
          </h3>
          <p className="text-gray-600 mt-2 ml-1 sm:ml-0">Manage common add-ons and customization options for your menu items.</p>
        </div>
        {/* Optional: Add a button here if relevant, e.g., "Add New Extra Group" if not handled within ReusableExtrasManager */}
      </header>
      <ReusableExtrasManager
        reusableExtras={reusableExtras}
        loadingExtras={loadingExtras}
        onAddGroup={addReusableExtraGroup}
        onUpdateGroup={updateReusableExtraGroup}
        onDeleteGroup={deleteReusableExtraGroup}
      />
    </section>
  </div>  );
}