"use client";
import { useContext } from "react";

import { AppContext } from "@/context/Authcontext";
import RestaurantDetails from "@/components/dashboardcomponent/ReataurantDetails";
import RestaurantHours from "@/components/dashboardcomponent/RestaurantHours";

export default function RestaurantTest() {
  const context = useContext(AppContext);
  if (!context) {
    return <div>loading.....</div>;
  }
  const { restaurantName, restaurantDetails } = context;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm mb-6">
        <h1 className="p-6 text-gray-900 text-3xl font-bold max-w-7xl mx-auto">
          {restaurantName || "Restaurant Setup"}
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Restaurant Configuration
            </h2>
            <p className="text-gray-600 mb-2">
              Complete your restaurant setup to get started
            </p>
          </div>

          <div className="md:flex md:flex-row p-6 gap-8">
            <div className="md:w-1/2 mb-6 md:mb-0">
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Restaurant Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <RestaurantDetails restaurantDetails={restaurantDetails} />
                {/* <RestaurantDetails /> */}
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Restaurant Hours
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <RestaurantHours restaurantDetails={restaurantDetails} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
