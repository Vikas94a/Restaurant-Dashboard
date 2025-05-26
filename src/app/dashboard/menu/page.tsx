"use client";

import { useAppSelector } from "@/store/hooks";
import MenuEditor from "@/components/dashboardcomponent/MenuEditor";
import { LoadingSpinner } from "@/components/dashboardcomponent/LoadingSpinner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MenuPage() {
  const router = useRouter();
  const { restaurantDetails, loading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, []);

  // Show loading screen
  if (authLoading || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-500 text-sm">Loading menu data...</p>
        </div>
      </div>
    );
  }

  // Show error if restaurant not set
  if (!restaurantDetails?.restaurantId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Restaurant Not Found
            </h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Please set up your restaurant details before managing the menu.
            </p>
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="w-full py-2 px-4 bg-primary text-white font-medium rounded-lg shadow hover:bg-primary-dark transition duration-200"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main layout
  return (
    <main className="h-screen w-full bg-gray-100 overflow-hidden">
      <div className="h-full flex flex-col">
        <header className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">
            Menu Management
          </h1>
        </header>

        <section className="flex-1 overflow-hidden">
          <MenuEditor restaurantId={restaurantDetails.restaurantId} />
        </section>
      </div>
    </main>
  );
}
