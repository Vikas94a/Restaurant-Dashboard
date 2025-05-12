"use client";
import React, { useState } from 'react'



interface Item{
    itemName: string;
itemDescription: string;
itemPrice: number;
}

interface Category{
    categoryName: string;
    categoryDescription: string;
    items: Item[];
}

function RestaurantMenu() {


const [items, setItems] = useState<Item>({
itemName: "",
itemDescription: "",
itemPrice: 0
})

const [category, setCategory] = useState<Category>({
categoryName: "",
categoryDescription: "",
items: []
})




  return (
    <div>
        <div>
            <h2>Restaurant Menu</h2>
        </div>
    </div>
  )
}

export default RestaurantMenu