"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { ChangeEvent, useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

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

function RestaurantMenu() {
  const [category, setCategory] = useState<Category[]>([
    {
      categoryName: "",
      categoryDescription: "",
      items: [],
    },
  ]);

  function handleCategoryChang(
    index: number,
    e: ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    const updateMenu = [...category];
    updateMenu[index] = { ...updateMenu[index], [name]: value };
    setCategory(updateMenu);
  }

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

  const restaurantId = "SFhFvVRfYKGj0nlLWFSk";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const menuRef = collection(db, "restaurants", restaurantId, "menu");

      for (const cat of category) {
        await addDoc(menuRef, cat);
      }

      toast.success("All menu categories saved successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Something went wrong while saving menu");
    }
  };

  return (
   <div className="flex flex-col bg-white shadow-2xl p-10">
  <div className="flex items-center">
    <h2 className="font-bold text-2xl bg-green-500 p-2 text-white rounded">
      Restaurant Menu
    </h2>
  </div>
  <div className="flex border-2 mt-4 p-5 rounded-md">
    <form onSubmit={handleSubmit}>
      {category.map((category, catIndex) => (
        <div className="border-2 flex flex-col gap-4 m-6 p-6 rounded-md" key={catIndex}>
          <Label className="font-bold text-sm text-gray-700">Category name</Label>
          <Input
            name="categoryName"
            value={category.categoryName}
            onChange={(e) => handleCategoryChang(catIndex, e)}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 w-full"
          />
          <Label className="text-sm text-gray-700">Category description</Label>
          <Input
            name="categoryDescription"
            value={category.categoryDescription}
            onChange={(e) => handleCategoryChang(catIndex, e)}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 w-full"
          />
          <div>
            {category.items.map((item, itemIndex) => (
              <div
                className="flex flex-col gap-4 mt-2 justify-center items-center p-5"
                key={itemIndex}
              >
                <div className="flex space-x-4">
                  <Label className="text-sm text-gray-700">Item Name</Label>
                  <Input
                    name="itemName"
                    value={item.itemName}
                    onChange={(e) => handleItemsChange(e, catIndex, itemIndex)}
                    className="flex-grow border border-gray-300 rounded-md p-2"
                  />
                  <Label className="text-sm text-gray-700">Price</Label>
                  <Input
                    name="itemPrice"
                    type="number"
                    value={item.itemPrice}
                    onChange={(e) => handleItemsChange(e, catIndex, itemIndex)}
                    className="w-24 border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="mb-4">
                  <Label className="text-sm text-gray-700">Item description</Label>
                  <Input
                    name="itemDescription"
                    value={item.itemDescription}
                    onChange={(e) => handleItemsChange(e, catIndex, itemIndex)}
                    className="border border-gray-300 rounded-md p-2 w-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            type="button"
            onClick={() => handleAddItem(catIndex)}
          >
            Add Item
          </Button>
        </div>
      ))}
      <div className="flex justify-center items-center p-2 gap-10">
        <Button
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          type="button"
          onClick={handleAddCategory}
        >
          Add Category
        </Button>
        <Button
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          type="submit"
        >
          Save
        </Button>
      </div>
    </form>
  </div>
</div>
  );
}

export default RestaurantMenu;
