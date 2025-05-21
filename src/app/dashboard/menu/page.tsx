"use client"; // Required by Next.js to indicate this is a client-side component

import { useAppSelector } from "@/store/hooks";
import MenuEditor from "@/components/dashboardcomponent/MenuEditor";
import { LoadingSpinner } from "@/components/dashboardcomponent/LoadingSpinner";

export default function MenuPage() {
  const { restaurantDetails, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!restaurantDetails?.restaurantId) {
    return (
      <div className="p-6 text-center text-gray-500">
        No restaurant found. Please set up your restaurant first.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Menu Management</h1>
      <MenuEditor restaurantId={restaurantDetails.restaurantId} />
    </div>
  );
}
