"use client"; // Ensures this component runs on the client side (Next.js specific)

import { useContext } from "react";
import { AppContext } from "@/context/Authcontext"; // Import global context for shared app state
import { useParams } from "next/navigation"; // Get dynamic route params (like restaurant ID)
import RestaurantMenu from "@/components/RestaurantMenu"; // Component to display menu for a restaurant

export default function MenuPage() {
    // Access shared context values (e.g. restaurant name)
    const context = useContext(AppContext);
    if (!context) return; // Return nothing if context is not available (shouldn't happen normally)

    const { restaurantName } = context;

    // Get the dynamic restaurant ID from the URL
    const params = useParams();
    const restaurantId = params.id as string;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Display the restaurant name */}
            <h1 className="text-2xl font-bold mb-8">{restaurantName}</h1>

            {/* Pass the restaurant ID to the menu component to fetch and show menu items */}
            <RestaurantMenu restaurantId={restaurantId} />
        </div>
    );
}
