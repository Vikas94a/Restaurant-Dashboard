import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/hooks/useCart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

// Define the shape of a menu item (like a dish on the menu)
interface Items {
  description?: string;
  name?: string;
  price?: number;
}

// Define a category on the menu which contains multiple items
interface MenuItem {
  id: string;
  categoryName: string; // e.g. "Starters", "Main Course", "Desserts"
  categoryDescription: string; // description of the category
  items: Items[]; // array of dishes in this category
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

  const normalizeItem = (item: any) => ({
    name: item.name || item.itemName || "",
    description: item.description || item.itemDescription || "",
    price: item.price ?? item.itemPrice ?? 0,
  });

  const {
    cart,
    handleAddToCart,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
  } = useCart();

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
        const items = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            categoryName: data.categoryName,
            categoryDescription: data.categoryDescription,
            items: (data.items || []).map(normalizeItem),
          };
        });
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
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 rounded-2xl shadow-inner overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">🍽️ Menu</h2>
        </div>
        <nav className="overflow-y-auto flex-1 custom-scroll">
          {menuItems.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.categoryName)}
              className={`w-full text-left px-6 py-4 transition-all duration-200 ease-in-out hover:bg-green-50 group ${
                selectedCategory === category.categoryName
                  ? "bg-green-100 border-l-4 border-green-500"
                  : ""
              }`}
            >
              <h3 className="text-base font-semibold text-gray-800 group-hover:text-green-600 transition">
                {category.categoryName}
              </h3>
              <p className="text-sm text-gray-500 mt-1 truncate">
                {category.categoryDescription}
              </p>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        {selectedCategoryData ? (
          <section>
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {selectedCategoryData.categoryName}
              </h2>
              {selectedCategoryData.categoryDescription && (
                <p className="text-gray-600 mt-2 text-base max-w-2xl">
                  {selectedCategoryData.categoryDescription}
                </p>
              )}
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategoryData.items?.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow hover:shadow-lg transition-all border border-gray-100 p-5 flex flex-col justify-between"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-green-600 font-bold text-lg">
                      ${item.price?.toFixed(2)}
                    </p>
                    {/* Conditional rendering based on whether item is in cart */}
                    {
                      item.name &&
                        item.price !== undefined &&
                        selectedCategoryData?.categoryName &&
                        restaurantId &&
                        (() => {
                          const itemId = `${restaurantId}-${item.name}`;
                          const cartItem = cart.items.find(
                            (cartItem) => cartItem.id === itemId
                          );

                          if (cartItem) {
                            // Item is in cart, show quantity controls
                            return (
                              <div className="flex items-center ml-auto border border-gray-300 rounded-md overflow-hidden">
                                <button
                                  className="px-3 py-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  onClick={() => handleDecreaseQuantity(itemId)}
                                  disabled={cartItem.quantity <= 1}
                                >
                                  <FontAwesomeIcon
                                    icon={faMinus}
                                    className="w-3 h-3 text-gray-600"
                                  />
                                </button>
                                <span className="px-4 py-1 bg-gray-100 text-sm font-medium text-gray-800">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  className="px-3 py-1 hover:bg-gray-200 transition-colors"
                                  onClick={() => handleIncreaseQuantity(itemId)}
                                >
                                  <FontAwesomeIcon
                                    icon={faPlus}
                                    className="w-3 h-3 text-gray-600"
                                  />
                                </button>
                              </div>
                            );
                          } else {
                            // Item is not in cart, show Add to Cart button
                            return (
                              <button
                                className="btn btn-sm bg-primary text-white hover:bg-primary-dark px-4 py-2"
                                onClick={() =>
                                  handleAddToCart({
                                    itemName: item.name as string,
                                    itemPrice: item.price as number,
                                    categoryName: selectedCategoryData.categoryName,
                                    restaurantId: restaurantId,
                                    customizations: [], // Add empty customizations array
                                    totalPrice: item.price as number // Set initial total price same as item price
                                  })
                                }
                              >
                                Add to Cart
                              </button>
                            );
                          }
                        })() /* Immediately invoke the function */
                    }
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center text-gray-500 mt-32 text-lg">
            👈 Select a category to view delicious items!
          </div>
        )}
      </main>
    </div>
  );
}
