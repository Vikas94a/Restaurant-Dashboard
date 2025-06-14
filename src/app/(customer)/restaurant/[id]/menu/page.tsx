"use client";

import { useParams } from "next/navigation";
import RestaurantMenu from "@/components/RestaurantMenu";
import Cart from "@/components/Cart";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "@/hooks/useCart";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Separate client component for the cart button
function CartButton({  onOpen }: { isOpen: boolean; onOpen: () => void }) {
  const { cart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    setItemCount(cart.items.length);
  }, [cart.items.length]);

  if (!mounted) {
    return (
      <button
        onClick={onOpen}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <FontAwesomeIcon
          icon={faShoppingCart}
          className="w-6 h-6"
        />
      </button>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="fixed bottom-6 right-6 z-50 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <FontAwesomeIcon
        icon={faShoppingCart}
        className="w-6 h-6"
      />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white">
          {itemCount}
        </span>
      )}
    </button>
  );
}

export default function MenuPage() {
  const params = useParams();
  const restaurantId = params.id as string;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const restaurantRef = doc(db, "restaurants", restaurantId);
        const restaurantDoc = await getDoc(restaurantRef);
        
        if (restaurantDoc.exists()) {
          const data = restaurantDoc.data();
          setRestaurantName(data.name || data.restaurantType || "Restaurant");
        } else {
          setRestaurantName("Restaurant Not Found");
        }
      } catch (error) {
        console.error("Error fetching restaurant details:", error);
        setRestaurantName("Error Loading Restaurant");
      } finally {
        setIsLoading(false);
      }
    };

    if (restaurantId) {
      fetchRestaurantDetails();
    }
  }, [restaurantId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add custom styles for scrollbar hiding */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Floating Cart Button */}
      <CartButton isOpen={isCartOpen} onOpen={() => setIsCartOpen(true)} />

      {/* Header with Restaurant Name */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>
            ) : (
              restaurantName
            )}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <RestaurantMenu restaurantId={restaurantId} />
      </div>

      {/* Cart Component */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
} 