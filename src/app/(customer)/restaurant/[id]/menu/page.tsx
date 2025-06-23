"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { RestaurantMenu } from "@/components/RestaurantMenu";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import type { NestedMenuItem } from '@/utils/menuTypes';

// Separate client component for the cart button
function CartButton({  onOpen }: { isOpen: boolean; onOpen: () => void }) {
  const { cart } = useCart();
  const totalItems = cart.items.reduce((acc: number, item) => acc + item.quantity, 0);

  return (
    <Button
      onClick={onOpen}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-lg"
    >
      <ShoppingCart className="w-5 h-5" />
      <span>Cart ({totalItems})</span>
    </Button>
  );
}

export default function RestaurantMenuPage() {
  const params = useParams();
  const [items, setItems] = useState<NestedMenuItem[]>([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!params.id) return;

      try {
        // Fetch restaurant details
        const restaurantRef = doc(db, "restaurants", params.id as string);
        const restaurantSnap = await getDoc(restaurantRef);

        if (restaurantSnap.exists()) {
          setRestaurantName(restaurantSnap.data().name || "");
        }

        // Fetch menu items
        const menuRef = collection(db, "restaurants", params.id as string, "menu");
        const menuSnap = await getDocs(menuRef);

        const menuItems: NestedMenuItem[] = [];
        menuSnap.forEach((doc) => {
          const data = doc.data();
          if (data.items && Array.isArray(data.items)) {
            menuItems.push(...data.items);
          }
        });

        setItems(menuItems);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      }
    };

    fetchRestaurantData();
  }, [params.id]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{restaurantName}</h1>
      <RestaurantMenu restaurantId={params.id as string} items={items} />
      <CartButton isOpen={isCartOpen} onOpen={() => setIsCartOpen(true)} />
    </div>
  );
} 