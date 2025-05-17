import React from "react";
import { Restaurant } from "./RestaurantDialog";

type RestaurantTypeProps = {
  restaurantDetails?: Restaurant;
};

function ReataurantDetails({ restaurantDetails }: RestaurantTypeProps) {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
        <p className="text-gray-700 text-sm leading-relaxed italic">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ut, reiciendis
          expedita ratione velit necessitatibus illum quia quaerat, vitae sit
          blanditiis beatae doloribus quibusdam eos possimus excepturi, temporibus
          iure cupiditate saepe quidem exercitationem illo pariatur minima.
          Voluptatibus sapiente expedita ducimus animi ut quas, dolorum temporibus
          repudiandae reprehenderit quasi cum, nesciunt laudantium?
        </p>
      </div>

      <div className="space-y-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <h4 className="text-gray-800 font-semibold mb-4 flex items-center text-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          Restaurant Location
        </h4>
        <div className="flex flex-col space-y-2">
          <span className="inline-block text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            {restaurantDetails?.streetName || "No street address provided"}
          </span>
          <div className="flex gap-3">
            <span className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm">
              {restaurantDetails?.zipCode || "N/A"}
            </span>
            <span className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm flex-grow">
              {restaurantDetails?.city || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <h4 className="text-gray-800 font-semibold mb-4 flex items-center text-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Contact Information
        </h4>
        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
          <p className="text-gray-700 flex items-center">
            <span className="text-gray-500 mr-2">Phone:</span>
            <span className="font-medium">
              {restaurantDetails?.phoneNumber || "No phone number provided"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReataurantDetails;
