import React from "react";
import { Restaurant } from "./RestaurantDialog";

type RestaurantTypeProps = {
  restaurantDetails?: Restaurant;
};

// Helper function to convert day name to number (0-6, Sunday-Saturday)
const getDayNumber = (day: string): number => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days.indexOf(day.toLowerCase());
};

function RestaurantHours({ restaurantDetails }: RestaurantTypeProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {restaurantDetails?.openingHours.map((hours, index) => {
          const isToday = new Date().getDay() === getDayNumber(hours.day);
          return (
            <div
              key={index}
              className={`flex justify-between items-center p-4 ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors duration-150`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${hours.closed ? 'bg-red-400' : 'bg-green-400'}`} />
                <span className="font-medium text-gray-700">
                  {hours.day.charAt(0).toUpperCase() + hours.day.slice(1)}
                </span>
              </div>
              <div className="flex items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${hours.closed
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'}`}
                >
                  {hours.closed ? "Closed" : `${hours.open} - ${hours.close}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RestaurantHours;
