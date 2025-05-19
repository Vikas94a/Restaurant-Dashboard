import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define the shape of a menu item (like a dish on the menu)
interface Items {
  itemDescription?: string;
  itemName?: string;
  itemPrice?: number;
}

// Define a category on the menu which contains multiple items
interface MenuItem {
  id: string;
  categoryName: string;          // e.g. "Starters", "Main Course", "Desserts"
  categoryDescription: string;   // description of the category
  items: Items[];                // array of dishes in this category
}

// Props for this component: we need the restaurant's ID to fetch its menu
interface RestaurantMenuProps {
  restaurantId: string;
}

export default function RestaurantMenu({ restaurantId }: RestaurantMenuProps) {
  // State to store all categories with their items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Loading and error states to manage fetch status (common pattern)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track which category user has selected to display items for that category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch menu categories and items from Firestore when restaurantId changes
  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        setError(null);

        // Firebase path to this restaurant's menu collection
        const menuRef = collection(db, "restaurants", restaurantId, "menu");

        // Get all documents (categories) inside that menu collection
        const querySnapshot = await getDocs(menuRef);

        // Map documents into an array of MenuItem objects
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MenuItem[];

        setMenuItems(items);

        // Automatically select the first category when menu loads
        if (items.length > 0) {
          setSelectedCategory(items[0].categoryName);
        }
      } catch (err) {
        console.error("Error fetching menu:", err);
        setError("Failed to load menu");
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we have a valid restaurant ID
    if (restaurantId) {
      fetchMenu();
    }
  }, [restaurantId]); // Re-run effect when restaurantId changes

  // Find the category object for the currently selected category
  const selectedCategoryData = menuItems.find(
    (category) => category.categoryName === selectedCategory
  );

  // Debug log to see fetched menu structure in console
  console.log(menuItems);

  return (
    <div className="flex h-[calc(100vh-160px)] bg-gray-50 rounded-2xl shadow-inner overflow-hidden">
      {/* Left sidebar with category buttons */}
      <aside className="w-52 bg-white border-r border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">🍽️ Categories</h2>
        </div>

        <nav className="overflow-y-auto custom-scroll h-full">
          {menuItems.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.categoryName)} // Select category on click
              className={`w-full text-left px-6 py-4 transition-all duration-200 ease-in-out hover:bg-gray-100 group ${
                selectedCategory === category.categoryName
                  ? "bg-green-50 border-l-4 border-green-500" // Highlight selected category
                  : ""
              }`}
            >
              <h3 className="text-base font-medium text-gray-800 group-hover:text-green-600 transition">
                {category.categoryName}
              </h3>
              <p className="text-sm text-gray-500 mt-1 truncate">
                {category.categoryDescription}
              </p>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content area displaying menu items for the selected category */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {selectedCategoryData ? (
          <section>
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedCategoryData.categoryName}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedCategoryData.categoryDescription}
              </p>
            </header>

            {/* Grid of individual menu items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategoryData.items?.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all border border-gray-100"
                >
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.itemName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.itemDescription}
                    </p>
                    <p className="text-green-600 font-bold text-md mt-2">
                      ${item.itemPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          // Placeholder message when no category is selected
          <div className="text-center text-gray-500 mt-16 text-lg">
            👈 Select a category to view menu items
          </div>
        )}
      </main>
    </div>
  );
}
