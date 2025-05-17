"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { ChangeEvent, useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { useContext } from "react";

import { AppContext } from "@/context/Authcontext";
// import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";

interface Item {
  itemName: string;
  itemDescription: string;
  itemPrice: number;
}

interface Category {
  categoryName: string;
  categoryDescription: string;
  items: Item[];
}

type Mode = "edit"| "preview  " 

function RestaurantMenu() {
  const context = useContext(AppContext);
  if (!context) {
    return <div>loading...</div>;
  }

  const { restaurantDetails } = context;
  const restaurantId = restaurantDetails?.restaurantId;

  // console.log(restaurantDetails?.restaurantId);

  const [category, setCategory] = useState<Category[]>([
    {
      categoryName: "",
      categoryDescription: "",
      items: [],
    },
  ]);
const [mode, setMode] = useState<Mode>("edit");

  function handleCategoryChang(
    index: number,
    e: ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    const updateMenu = [...category];
    updateMenu[index] = { ...updateMenu[index], [name]: value };
    setCategory(updateMenu);
  }

  // const restaurantId = restaurantDetails?.restaurantId;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      toast.error("Restaurant ID not found. Please try again later.");
      return;
    }

    try {
      const menuRef = collection(db, "restaurants", restaurantId, "menu");
      let success = true;

      for (const cat of category) {
        // Validate category
        if (!cat.categoryName.trim() || !cat.categoryDescription.trim()) {
          toast.error("Please fill in all category details");
          return;
        }

        // Check for duplicate items in the same category
        const itemNames = new Set<string>();
        const validItems: Item[] = [];

        cat.items.forEach((item, index) => {
          if (!item.itemName.trim() || !item.itemPrice) {
            toast.error(
              `Please fill in all details for item ${index + 1} in category ${
                cat.categoryName
              }`
            );
            success = false;
            return;
          }

          if (itemNames.has(item.itemName.trim().toLowerCase())) {
            toast.error(
              `Duplicate item name "${item.itemName}" found in category ${cat.categoryName}`
            );
            success = false;
            return;
          }

          itemNames.add(item.itemName.trim().toLowerCase());
          validItems.push(item);
        });

        if (!success) return;

        // Check if category exists
        const q = query(
          collection(db, "restaurants", restaurantId, "menu"),
          where("categoryName", "==", cat.categoryName)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Only add valid items to category
          const categoryWithValidItems = {
            ...cat,
            items: validItems,
          };
          await addDoc(menuRef, categoryWithValidItems);
          toast.success("Items added successfully");
        } else {
          toast.error(`Category "${cat.categoryName}" already exists`);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Something went wrong while saving menu");
    }
  };

  function handleAddCategory() {
    setCategory([
      ...category,
      { categoryName: "", categoryDescription: "", items: [] },
    ]);
  }

  function handleItemsChange(
    e: ChangeEvent<HTMLInputElement>,
    catIndex: number,
    itemIndex: number
  ) {
    const { name, value } = e.target;
    const updateCategory = [...category];
    const updateItems = [...updateCategory[catIndex].items];
    updateItems[itemIndex] = {
      ...updateItems[itemIndex],
      [name]: name === "itemPrice" ? parseFloat(value) || 0 : value,
    };
    updateCategory[catIndex] = {
      ...updateCategory[catIndex],
      items: updateItems,
    };
    setCategory(updateCategory);
  }

  function handleAddItem(catIndex: number) {
    const updateCategory = [...category];
    updateCategory[catIndex].items.push({
      itemName: "",
      itemDescription: "",
      itemPrice: 0,
    });
    setCategory(updateCategory);
  }

  // console.log(category);
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mr-3 text-green-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 2a4 4 0 00-4 4v1H3a1 1 0 000 2h1v1a3 3 0 003 3h1.17A3.001 3.001 0 0111 15v1h2v-1a3 3 0 013-3h1.17A3.001 3.001 0 0115 9V8h1a1 1 0 100-2h-2V5a4 4 0 00-4-4H9z" />
            </svg>
            Restaurant Menu
          </h2>
          <Button
            type="button"
            onClick={handleAddCategory}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Category
          </Button>
        </div>

        {category.map((category, catIndex) => (
          <div
            key={catIndex}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-green-200"
          >
            <div className="p-8 space-y-6">
              ¨
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name
                    </Label>
                    <Input
                      name="categoryName"
                      value={category.categoryName}
                      onChange={(e) => handleCategoryChang(catIndex, e)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150"
                      placeholder="e.g., Appetizers"
                      required
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Description
                    </Label>
                    <Input
                      name="categoryDescription"
                      value={category.categoryDescription}
                      onChange={(e) => handleCategoryChang(catIndex, e)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors duration-150"
                      placeholder="A short description of this category"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Items</h3>
                    <Button
                      type="button"
                      onClick={() => handleAddItem(catIndex)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gray-100 hover:border-green-300 hover:bg-green-50/30 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="col-span-2">
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Item Name
                            </Label>
                            <Input
                              name="itemName"
                              value={item.itemName}
                              onChange={(e) =>
                                handleItemsChange(e, catIndex, itemIndex)
                              }
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                              placeholder="e.g., Caesar Salad"
                              required
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Price
                            </Label>
                            <Input
                              name="itemPrice"
                              type="number"
                              value={item.itemPrice}
                              onChange={(e) =>
                                handleItemsChange(e, catIndex, itemIndex)
                              }
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Description
                          </Label>
                          <Input
                            name="itemDescription"
                            value={item.itemDescription}
                            onChange={(e) =>
                              handleItemsChange(e, catIndex, itemIndex)
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                            placeholder="A brief description of the item"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Save Menu
                </Button>
              </form>
            </div>
          </div>
        ))}
        <div className="mt-8 flex justify-end space-x-4"></div>
      </div>
    </div>
  );
}

export default RestaurantMenu;
