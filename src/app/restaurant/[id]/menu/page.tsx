"use client"; // Ensures this component runs on the client side (Next.js specific)

import { useAppSelector } from '@/store/hooks';
import { useParams } from "next/navigation"; // Get dynamic route params (like restaurant ID)
import RestaurantMenu from "@/components/RestaurantMenu"; // Component to display menu for a restaurant
import Cart from "@/components/Cart";
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '@/hooks/useCart';
import { useAppDispatch } from '@/store/hooks';
import { fetchRestaurantHours } from '@/store/features/restaurantSlice';
import { db } from '@/lib/firebase';

export default function MenuPage() {
    // Access shared context values (e.g. restaurant name)
    const restaurantName = useAppSelector((state) => state.auth.restaurantName);

    // Get the dynamic restaurant ID from the URL
    const params = useParams();
    const restaurantId = params.id as string;
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { cart } = useCart();
    const dispatch = useAppDispatch();
    const restaurant = useAppSelector(state => state.restaurant);
    const { hours, status, error } = restaurant;

    useEffect(() => {
        if (restaurantId) {
            dispatch(fetchRestaurantHours(restaurantId));
        }
    }, [restaurantId, dispatch]);

    return (
        <div className="container mx-auto px-1 py-3">
            {/* Header with Cart Toggle */}
            <div className="flex justify-between items-center mb-2 sticky top-0 bg-white z-10 py-1">
                <h1 className="text-2xl font-bold">{restaurantName}</h1>
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    <FontAwesomeIcon icon={faShoppingCart} className="w-6 h-6 text-gray-700" />
                    {cart.items.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white">
                            {cart.items.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Pass the restaurant ID to the menu component to fetch and show menu items */}
            <RestaurantMenu restaurantId={restaurantId} />

            {/* Cart Component */}
            <Cart 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)}
            />
        </div>
    );
}
