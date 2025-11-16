"use client";

import React, { useState } from "react";
import RestaurantDialog from "@/features/overview/components/RestaurantDialog";
import { useAppSelector } from "@/store/hooks";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Building2, MapPin, Clock, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DashboardOverview() {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { restaurantDetails } = useAppSelector((state) => state.auth);
  const [isLoading] = useState(false);

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
              Let&apos;s get your restaurant set up so you can start managing your business efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Building2 className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Restaurant Profile</h3>
              <p className="text-gray-600">Set up your restaurant&apos;s basic information and branding.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <MapPin className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Details</h3>
              <p className="text-gray-600">Add your restaurant&apos;s address and contact information.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Clock className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Operating Hours</h3>
              <p className="text-gray-600">Configure your restaurant&apos;s opening and closing times.</p>
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
    <div className="container mx-auto p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to your restaurant&apos;s dashboard</h1>
        <p className="text-lg mb-8">Here&apos;s what&apos;s happening in your restaurant</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-2">Today&apos;s Orders</h2>
          <p className="text-3xl font-bold text-primary">0</p>
          <p className="text-sm text-gray-600">Total orders today</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-2">Today&apos;s Revenue</h2>
          <p className="text-3xl font-bold text-primary">$0</p>
          <p className="text-sm text-gray-600">Total revenue today</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-2">Menu Items</h2>
          <p className="text-3xl font-bold text-primary">0</p>
          <p className="text-sm text-gray-600">Active menu items</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-2">Reviews</h2>
          <p className="text-3xl font-bold text-primary">0</p>
          <p className="text-sm text-gray-600">Customer reviews</p>
        </Card>
      </div>
    </div>
  );
}
