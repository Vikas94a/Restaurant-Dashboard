"use client";

import React, { useState, useEffect } from "react";
import { Restaurant } from "./RestaurantDialog";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';

type RestaurantDetailsProps = {
  restaurantDetails: Partial<Restaurant>;
  onDetailsChange: (details: Partial<Restaurant>) => void;
  isEditing: boolean;
};

function RestaurantDetails({ restaurantDetails, onDetailsChange, isEditing }: RestaurantDetailsProps) {
  const [details, setDetails] = useState<Partial<Restaurant>>({
    streetName: '',
    zipCode: '',
    city: '',
    phoneNumber: '',
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedDetails = { ...details, [name]: value };
    setDetails(updatedDetails);
    onDetailsChange(updatedDetails);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <h4 className="text-gray-800 font-semibold mb-4 flex items-center text-lg">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="h-5 w-5 mr-2 text-blue-500" />
          Restaurant Location
        </h4>
        <div className="flex flex-col space-y-4">
          <div>
            <Label htmlFor="streetName">Street Name</Label>
            <Input
              id="streetName"
              name="streetName"
              value={details.streetName || ''}
              onChange={handleInputChange}
              placeholder="Street Name*"
              required
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
            />
          </div>
          <div className="flex gap-3">
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

      <div className="space-y-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <h4 className="text-gray-800 font-semibold mb-4 flex items-center text-lg">
          <FontAwesomeIcon icon={faPhone} className="h-5 w-5 mr-2 text-blue-500" />
          Contact Information
        </h4>
        <div className="space-y-2">
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
