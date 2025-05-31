"use client"; // Required for Next.js to enable client-side interactivity

import React, { useState, useEffect } from "react";
import { Restaurant } from "./RestaurantDialog"; // Importing the Restaurant type from another component
import { Input } from "../ui/input"; // Custom Input component (probably from shadcn/ui or similar)
import { Label } from "@/components/ui/label"; // Accessible Label component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';

// Props type for the component
type RestaurantDetailsProps = {
  restaurantDetails: Partial<Restaurant>; // Restaurant details passed from parent
  onDetailsChange: (details: Partial<Restaurant>) => void; // Callback to update details in parent
  isEditing: boolean; // Whether fields should be editable
};

// Functional component
function RestaurantDetails({ restaurantDetails, onDetailsChange, isEditing }: RestaurantDetailsProps) {
  // Local state for input fields
  const [details, setDetails] = useState<Partial<Restaurant>>({
    streetName: '',
    zipCode: '',
    city: '',
    phoneNumber: '',
  });

  // Sync props to local state when restaurantDetails change
  useEffect(() => {
    if (restaurantDetails) {
      setDetails({
        streetName: restaurantDetails.streetName || "",
        zipCode: restaurantDetails.zipCode || "",
        city: restaurantDetails.city || "",
        phoneNumber: restaurantDetails.phoneNumber || "",
      });
    }
  }, [restaurantDetails]);

  // Update local state and notify parent on input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedDetails = { ...details, [name]: value };
    setDetails(updatedDetails); // update local state
    onDetailsChange(updatedDetails); // pass updated data to parent
  };

  return (
    <div className="space-y-8">
      {/* --- Restaurant Location Section --- */}
      <div className="space-y-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <h4 className="text-gray-800 font-semibold mb-4 flex items-center text-lg">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="h-5 w-5 mr-2 text-blue-500" />
          Restaurant Location
        </h4>

        <div className="flex flex-col space-y-4">
          {/* Street Name */}
          <div>
            <Label htmlFor="streetName">Street Name</Label>
            <Input
              id="streetName"
              name="streetName"
              value={
                details.streetName
                  ? details.streetName.charAt(0).toUpperCase() + details.streetName.slice(1) // Capitalize first letter
                  : ""
              }
              onChange={handleInputChange}
              placeholder="Street Name*"
              required
              disabled={!isEditing} // Disable input if not in editing mode
              className={!isEditing ? 'bg-gray-50' : ''} // Light background when disabled
            />
          </div>

          {/* Zip Code and City */}
          <div className="flex gap-3">
            {/* Zip Code */}
            <div className="w-1/3">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={details.zipCode || ''}
                onChange={handleInputChange}
                placeholder="0000*"
                required
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>

            {/* City */}
            <div className="w-2/3">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={details.city || ''}
                onChange={handleInputChange}
                placeholder="City name*"
                required
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Contact Information Section --- */}
      <div className="space-y-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <h4 className="text-gray-800 font-semibold mb-4 flex items-center text-lg">
          <FontAwesomeIcon icon={faPhone} className="h-5 w-5 mr-2 text-blue-500" />
          Contact Information
        </h4>

        <div className="space-y-2">
          {/* Phone Number */}
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={details.phoneNumber || ''}
              onChange={handleInputChange}
              placeholder="00000000*"
              required
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RestaurantDetails;
