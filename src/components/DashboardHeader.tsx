"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "@/store/hooks";
import Breadcrumb from "./Breadcrumb";

interface DashboardHeaderProps {
  className?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ className = "" }) => {
  const { restaurantDetails } = useAppSelector((state) => state.auth);

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          {/* Breadcrumb */}
          <div className="mb-3">
            <Breadcrumb />
          </div>

          {/* Restaurant Info */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {restaurantDetails?.name || "Restaurant Name"}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                {restaurantDetails?.streetName && restaurantDetails?.city && (
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4" />
                    <span>{`${restaurantDetails.streetName}, ${restaurantDetails.city}, ${restaurantDetails.zipCode}`}</span>
                  </div>
                )}
                {restaurantDetails?.phoneNumber && (
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
                    <span>{restaurantDetails.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
