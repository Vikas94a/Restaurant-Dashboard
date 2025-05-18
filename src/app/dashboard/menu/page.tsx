"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { toast } from "sonner";
import { useContext } from "react";
import { AppContext } from "@/context/Authcontext";
import CategorySection from "@/components/MenuEditor/CategorySection";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button";

interface Item {
  itemName: string;
  itemDescription: string;
  itemPrice: number;
}

interface Category {
  categoryName: string;
  categoryDescription: string;
  items: Item[];
  isEditing?: boolean;
  docId?: string;
}

function RestaurantMenu() {
  const context = useContext(AppContext);
  if (!context) {
    return <div>loading...</div>;
  }

  const { restaurantDetails } = context;
  const restaurantId = restaurantDetails?.restaurantId;

  const [category, setCategory] = useState<Category[]>([]);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch menu data when component mounts
  useEffect(() => {
    const fetchMenuData = async () => {
      if (!restaurantId) return;

      try {
        setIsLoading(true);
        const menuRef = collection(db, "restaurants", restaurantId, "menu");
        const querySnapshot = await getDocs(menuRef);
        
        if (querySnapshot.empty) {
          // If no menu data exists, initialize with an empty category
          setCategory([{
            categoryName: "",
            categoryDescription: "",
            items: [],
            isEditing: true,
          }]);
        } else {
          // Convert Firestore data to our category format
          const categories = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            docId: doc.id,
            isEditing: false,
          })) as Category[];
          
          setCategory(categories);
        }
      } catch (error) {
        console.error("Error fetching menu data:", error);
        toast.error("Failed to load menu data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantId]);

  function handleCategoryChange(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    const updateMenu = [...category];
    updateMenu[index] = { ...updateMenu[index], [name]: value };
    setCategory(updateMenu);
  }

  const handleSubmit = async (e: React.FormEvent, catIndex: number) => {
    e.preventDefault();
    if (!restaurantId) {
      toast.error("Restaurant ID not found. Please try again later.");
      return;
    }

    try {
      const menuRef = collection(db, "restaurants", restaurantId, "menu");
      const cat = category[catIndex];

      if (!cat.categoryName.trim() || !cat.categoryDescription.trim()) {
        toast.error("Please fill in all category details");
        return;
      }

      const itemNames = new Set<string>();
      const validItems: Item[] = [];

      cat.items.forEach((item, index) => {
        if (!item.itemName.trim() || !item.itemPrice) {
          toast.error(
            `Please fill in all details for item ${index + 1} in category ${
              cat.categoryName
            }`
          );
          return;
        }

        if (itemNames.has(item.itemName.trim().toLowerCase())) {
          toast.error(
            `Duplicate item name "${item.itemName}" found in category ${cat.categoryName}`
          );
          return;
        }

        itemNames.add(item.itemName.trim().toLowerCase());
        validItems.push(item);
      });

      if (cat.docId) {
        // Update existing category
        const categoryDoc = doc(
          db,
          "restaurants",
          restaurantId,
          "menu",
          cat.docId
        );
        await updateDoc(categoryDoc, {
          categoryName: cat.categoryName,
          categoryDescription: cat.categoryDescription,
          items: validItems,
        });

        // Update local state to disable editing
        const updateMenu = [...category];
        updateMenu[catIndex] = {
          ...updateMenu[catIndex],
          isEditing: false,
        };
        setCategory(updateMenu);

        toast.success("Category updated successfully");
      } else {
        // Check if category name already exists
        const q = query(
          collection(db, "restaurants", restaurantId, "menu"),
          where("categoryName", "==", cat.categoryName)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          const docRef = await addDoc(menuRef, {
            categoryName: cat.categoryName,
            categoryDescription: cat.categoryDescription,
            items: validItems,
          });

          // Update local state with docId and disable editing
          const updateMenu = [...category];
          updateMenu[catIndex] = {
            ...updateMenu[catIndex],
            docId: docRef.id,
            isEditing: false,
          };
          setCategory(updateMenu);

          toast.success("Category added successfully");
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
      { categoryName: "", categoryDescription: "", items: [], isEditing: true },
    ]);
    // Scroll to the new category
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }

  function handleItemsChange(
    e: React.ChangeEvent<HTMLInputElement>,
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

  function handleEdit(catIndex: number) {
    const updateCategory = [...category];
    updateCategory[catIndex] = {
      ...updateCategory[catIndex],
      isEditing: true,
    };
    setCategory(updateCategory);
    setSelectedCategoryIndex(catIndex);
  }

  function handleAddItem(catIndex: number) {
    const updateCategory = [...category];
    updateCategory[catIndex].items.push({
      itemName: "",
      itemDescription: "",
      itemPrice: 0,
    });
    setCategory(updateCategory);
    setSelectedCategoryIndex(catIndex);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <FontAwesomeIcon icon={faUtensils} className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Restaurant Menu</h2>
              <p className="text-gray-500 mt-1">Manage your menu categories and items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {category.map((cat, catIndex) => (
            <div
              key={cat.docId || catIndex}
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
