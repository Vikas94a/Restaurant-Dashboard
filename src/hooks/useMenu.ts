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
import { Category, Item } from "@/types/menu";

// Custom React hook to manage menu categories and items for a given restaurant
export const useMenu = (restaurantId: string | undefined) => {
  // State to store categories fetched from Firestore or created locally
  const [category, setCategory] = useState<Category[]>([]);

  // Index of currently selected category (for editing UI)
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);

  // Loading state to show spinner or disable UI while fetching data
  const [loading, setLoading] = useState(false);

  // Effect to fetch menu data from Firestore when restaurantId changes
  useEffect(() => {
    const fetchMenuData = async () => {
      if (!restaurantId) return; // Exit if no restaurantId provided

      try {
        setLoading(true); // Start loading indicator

        // Reference to the menu subcollection of the given restaurant
        const menuRef = collection(db, "restaurants", restaurantId, "menu");
        
        // Fetch all documents (categories) under the menu collection
        const querySnapshot = await getDocs(menuRef);

        if (querySnapshot.empty) {
          // If no categories found, initialize with one empty editable category
          setCategory([
            {
              categoryName: "",
              categoryDescription: "",
              items: [],
              isEditing: true,
            },
          ]);
        } else {
          // Map over fetched categories to format items and add metadata
          const categories = querySnapshot.docs.map((doc) => {
            const data = doc.data();

            // Ensure each item has a unique id, generate if missing
            const itemsWithIds = data.items?.map((item: Item) => ({
              ...item,
              id: item.id || crypto.randomUUID(),
            })) || [];

            return {
              ...data,
              items: itemsWithIds,
              docId: doc.id, // store Firestore document id for later updates
              isEditing: false, // start with view mode (not editing)
            };
          }) as Category[];

          setCategory(categories); // Store categories in state
        }
      } catch (error) {
        console.error("Error fetching menu data:", error);
        toast.error("Failed to load menu data"); // Notify user of error
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };

    fetchMenuData(); // Invoke fetch function when restaurantId changes
  }, [restaurantId]);

  // Handle changes to category fields (name or description)
  const handleCategoryChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updateMenu = [...category];
    updateMenu[index] = { ...updateMenu[index], [name]: value };
    setCategory(updateMenu);
  };

  // Handle form submit to add or update a category in Firestore
  const handleSubmit = async (e: React.FormEvent, catIndex: number) => {
    e.preventDefault();

    if (!restaurantId) {
      toast.error("Restaurant ID not found. Please try again later.");
      return;
    }

    try {
      const menuRef = collection(db, "restaurants", restaurantId, "menu");
      const cat = category[catIndex];

      // Validate category name and description are not empty
      if (!cat.categoryName.trim() || !cat.categoryDescription.trim()) {
        toast.error("Please fill in all category details");
        return;
      }

      // Validate and prepare category items for saving
      const itemNames = new Set<string>();
      const validItems: Omit<Item, "id">[] = [];

      cat.items.forEach((item, index) => {
        // Check that item name and price are filled
        if (!item.itemName.trim() || !item.itemPrice) {
          toast.error(
            `Please fill in all details for item ${index + 1} in category ${cat.categoryName}`
          );
          return;
        }

        // Check for duplicate item names (case-insensitive)
        const itemNameLower = item.itemName.trim().toLowerCase();
        if (itemNames.has(itemNameLower)) {
          toast.error(
            `Duplicate item name "${item.itemName}" found in category ${cat.categoryName}`
          );
          return;
        }

        itemNames.add(itemNameLower);

        // Remove id before saving and ensure proper formatting of fields
        const { id, ...itemData } = item;
        validItems.push({
          ...itemData,
          itemName: itemData.itemName.trim(),
          itemDescription: itemData.itemDescription || "",
          itemPrice: Number(itemData.itemPrice) || 0,
        });
      });

      if (cat.docId) {
        // If category exists in Firestore, update it
        const categoryDoc = doc(db, "restaurants", restaurantId, "menu", cat.docId);
        await updateDoc(categoryDoc, {
          categoryName: cat.categoryName,
          categoryDescription: cat.categoryDescription,
          items: validItems,
        });

        // Mark category as no longer editing
        const updateMenu = [...category];
        updateMenu[catIndex] = {
          ...updateMenu[catIndex],
          isEditing: false,
        };
        setCategory(updateMenu);

        toast.success("Category updated successfully");
      } else {
        // If new category, check for duplicates before adding
        const q = query(
          collection(db, "restaurants", restaurantId, "menu"),
          where("categoryName", "==", cat.categoryName)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Add new category to Firestore
          const docRef = await addDoc(menuRef, {
            categoryName: cat.categoryName,
            categoryDescription: cat.categoryDescription,
            items: validItems,
          });

          // Update state with new docId and stop editing mode
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

  // Add a new empty category to the list and scroll to bottom for user input
  const handleAddCategory = () => {
    setCategory([
      ...category,
      { categoryName: "", categoryDescription: "", items: [], isEditing: true },
    ]);
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  // Handle changes to item fields (name, description, price) inside a category
  const handleItemsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    catIndex: number,
    itemIndex: number
  ) => {
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
  };

  // Enable editing mode for a category
  const handleEdit = (catIndex: number) => {
    const updateCategory = [...category];
    updateCategory[catIndex] = {
      ...updateCategory[catIndex],
      isEditing: true,
    };
    setCategory(updateCategory);
    setSelectedCategoryIndex(catIndex);
  };

  // Add a new empty item inside a specific category
  const handleAddItem = (catIndex: number) => {
    const updateCategory = [...category];
    const id = crypto.randomUUID(); // Generate unique ID for new item

    updateCategory[catIndex].items.push({
      id,
      itemName: "",
      itemDescription: "",
      itemPrice: 0,
    });

    setCategory(updateCategory);
    setSelectedCategoryIndex(catIndex);
  };

  // Return all state variables and handler functions for use in components
  return {
    category,
    loading,
    selectedCategoryIndex,
    handleCategoryChange,
    handleSubmit,
    handleAddCategory,
    handleItemsChange,
    handleEdit,
    handleAddItem,
  };
};
