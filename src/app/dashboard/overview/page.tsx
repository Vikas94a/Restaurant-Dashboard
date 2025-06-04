"use client";

import React, { useEffect, useState } from "react";
import RestaurantDialog from "@/components/dashboardcomponent/RestaurantDialog";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/dashboardcomponent/LoadingSpinner";
import { Building2, MapPin, Phone, Clock, Utensils } from "lucide-react";

export default function OverviewPage() {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const router = useRouter();
  const { restaurantDetails, isLoading } = useAppSelector((state) => state.auth);

  // Check if restaurant details are missing
  const hasRestaurantDetails = restaurantDetails?.streetName && 
    restaurantDetails?.city && 
    restaurantDetails?.zipCode && 
    restaurantDetails?.phoneNumber && 
    restaurantDetails?.restaurantType;

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // If no restaurant details, show the welcome screen with slide-in panel
  if (!hasRestaurantDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your Restaurant Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let's get your restaurant set up so you can start managing your business efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Building2 className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Restaurant Profile</h3>
              <p className="text-gray-600">Set up your restaurant's basic information and branding.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <MapPin className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Details</h3>
              <p className="text-gray-600">Add your restaurant's address and contact information.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Clock className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Operating Hours</h3>
              <p className="text-gray-600">Configure your restaurant's opening and closing times.</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Utensils className="w-5 h-5 mr-2" />
              Complete Restaurant Setup
            </button>
          </div>
        </div>

        <RestaurantDialog isOpen={isOpen} setIsOpen={setIsOpen} isMandatory={true} />
      </div>
    );
  }

  // If we have restaurant details, show the overview content
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      {/* Add your overview content here */}
    </div>
  );
}
