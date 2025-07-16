"use client";

import { useParams } from "next/navigation";
import RestaurantMenu from "@/components/RestaurantMenu";
import Cart from "@/components/Cart";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "@/hooks/useCart";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

// Separate client component for the cart button
function CartButton({ onOpen }: { isOpen: boolean; onOpen: () => void }) {
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
      className="fixed bottom-4 right-4 z-50 p-2.5 sm:p-3 bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-opacity-50 transform hover:scale-105"
    >
      <FontAwesomeIcon
        icon={faShoppingCart}
        className="w-4 h-4 sm:w-5 sm:h-5"
      />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-yellow-300 text-orange-800 text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center ring-1 ring-white shadow-md animate-pulse">
          {itemCount}
        </span>
      )}
    </button>
  );
}

export default function MenuPage() {
  const params = useParams();
  const domain = params.domain as string;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantByDomain = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query restaurants collection by domain
        const restaurantsQuery = query(
          collection(db, "restaurants"), 
          where("domain", "==", domain)
        );
        const querySnapshot = await getDocs(restaurantsQuery);
        
        if (querySnapshot.empty) {
          setError("Restaurant not found");
          setRestaurantName("Restaurant Not Found");
          return;
        }

        const restaurantDoc = querySnapshot.docs[0];
        const data = restaurantDoc.data();
        setRestaurantId(restaurantDoc.id);
        setRestaurantName(data.name || data.restaurantType || "Restaurant");
      } catch (error) {
        console.error("Error fetching restaurant details:", error);
        setError("Error Loading Restaurant");
        setRestaurantName("Error Loading Restaurant");
      } finally {
        setIsLoading(false);
      }
    };

    if (domain) {
      fetchRestaurantByDomain();
    }
  }, [domain]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h1>
          <p className="text-gray-600">The restaurant you're looking for doesn't exist or may have been moved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25 via-red-25 to-yellow-25">
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
      <div className="bg-gradient-to-r from-orange-400 to-red-400 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center">
            {isLoading ? (
              <div className="animate-pulse bg-orange-200 h-5 sm:h-6 w-32 sm:w-48 rounded mx-auto"></div>
            ) : (
              <span className="drop-shadow-md">{restaurantName}</span>
            )}
          </h1>
          <p className="text-orange-50 text-center mt-1 text-xs sm:text-sm">
            Delicious food, delivered fresh to you
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {restaurantId && <RestaurantMenu restaurantId={restaurantId} />}
      </div>

      {/* Cart Component */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
} 