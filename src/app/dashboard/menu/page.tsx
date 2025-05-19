"use client"; // Required by Next.js to indicate this is a client-side component

import { useContext } from "react";
import { AppContext } from "@/context/Authcontext"; // Context for shared global state (e.g. restaurant info)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button"; // Custom UI button component
import CategorySection from "@/components/MenuEditor/CategorySection"; // Renders each category and its items
import { LoadingSpinner } from "@/components/MenuEditor/LoadingSpinner"; // Spinner shown during data fetch
import { useMenu } from "@/hooks/useMenu"; // Custom hook to manage menu logic (state, handlers, etc.)

function RestaurantMenu() {
  // Get restaurant details from context
  const context = useContext(AppContext);
  if (!context) {
    return <div>loading...</div>; // Fallback in case context is not ready
  }

  const { restaurantDetails } = context;
  const restaurantId = restaurantDetails?.restaurantId;

  // Extract menu state and handlers from custom hook
  const {
    category, // List of categories
    loading, // Whether menu data is still loading
    selectedCategoryIndex, // Which category is currently selected
    handleCategoryChange, // Updates category name
    handleSubmit, // Saves category or item changes
    handleAddCategory, // Adds a new category
    handleItemsChange, // Updates item fields
    handleEdit, // Edits item/category
    handleAddItem, // Adds a new item to a category
  } = useMenu(restaurantId);

  // Show loading spinner while data is being fetched
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with icon and intro */}
        <div className="flex items-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <FontAwesomeIcon
                icon={faUtensils}
                className="h-8 w-8 text-green-600"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Restaurant Menu
              </h2>
              <p className="text-gray-500 mt-1">
                Manage your menu categories and items
              </p>
            </div>
          </div>
        </div>

        {/* Render each category section */}
        <div className="grid grid-cols-1 gap-6">
          {category.map((cat, catIndex) => (
            <div
              key={cat.docId || catIndex} // Use Firestore docId if available, else fallback to index
              className={`transform transition-all duration-200 ease-in-out ${
                selectedCategoryIndex === catIndex
                  ? "ring-2 ring-green-500 shadow-lg scale-[1.02]"
                  : "hover:shadow-md"
              } bg-white rounded-xl overflow-hidden`}
            >
              <CategorySection
                category={cat}
                catIndex={catIndex}
                onCategoryChange={handleCategoryChange}
                onItemChange={handleItemsChange}
                onSubmit={handleSubmit}
                onEdit={handleEdit}
                onAddItem={() => handleAddItem(catIndex)}
                isSelected={selectedCategoryIndex === catIndex}
              />
            </div>
          ))}
        </div>

        {/* Sticky button to add a new category */}
        <div className="sticky bottom-4 left-4 z-50">
          <Button
            onClick={handleAddCategory}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150 shadow-lg hover:shadow-xl"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5 mr-2" />
            Add Category
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RestaurantMenu;
