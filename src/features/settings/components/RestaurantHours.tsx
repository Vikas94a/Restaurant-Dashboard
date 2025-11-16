"use client";

import React, { useState, useEffect } from "react";
import { Restaurant, OpeningHours, day } from "@/features/overview/components/RestaurantDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type RestaurantHoursProps = {
  restaurantDetails: Partial<Restaurant>;
  onHoursChange: (hours: OpeningHours[]) => void;
  isEditing: boolean;
};

function RestaurantHours({ restaurantDetails, onHoursChange, isEditing }: RestaurantHoursProps) {
  const [hours, setHours] = useState<OpeningHours[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && restaurantDetails?.openingHours) {
      // Initialize state with existing opening hours
      setHours(restaurantDetails.openingHours);
      setInitialized(true);
    } else if (!initialized && !restaurantDetails?.openingHours) {
      // Initialize with default structure if no hours exist
      setHours(day.map((d) => ({ day: d, open: "", close: "", closed: false })));
      setInitialized(true);
    }
  }, [restaurantDetails, initialized]);

  const handleTimeChange = (index: number, field: "open" | "close", value: string) => {
    const updatedHours = [...hours];
    updatedHours[index][field] = value;
    setHours(updatedHours);
    onHoursChange(updatedHours); // Notify parent of change
  };

  const handleClosedChange = (index: number, checked: boolean) => {
    const updatedHours = [...hours];
    updatedHours[index].closed = checked;
     // Clear times if marked as closed
    if (checked) {
        updatedHours[index].open = "";
        updatedHours[index].close = "";
    }
    setHours(updatedHours);
    onHoursChange(updatedHours); // Notify parent of change
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {hours.map((hoursEntry, index) => (
          <div
            key={hoursEntry.day}
            className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 ${hoursEntry.closed ? 'bg-gray-100' : 'hover:bg-gray-50'} transition-colors duration-150`}
          >
            <div className="flex items-center space-x-3 mb-2 sm:mb-0 w-32">
              <div className={`w-2 h-2 rounded-full ${hoursEntry.closed ? 'bg-red-400' : 'bg-green-400'}`} />
              <span className="font-medium text-gray-700">
                {hoursEntry.day.charAt(0).toUpperCase() + hoursEntry.day.slice(1)}
              </span>
            </div>
            <div className="flex items-center space-x-4 flex-grow justify-end">
              <div className="flex items-center space-x-2">
                 <Label htmlFor={`closed-${index}`} className="text-sm text-gray-700">Closed:</Label>
                <Checkbox
                  id={`closed-${index}`}
                  checked={hoursEntry.closed}
                  onCheckedChange={(checked: boolean) => handleClosedChange(index, checked)}
                  disabled={!isEditing}
                  className={!isEditing ? 'opacity-50' : ''}
                />
              </div>
               {!hoursEntry.closed && (
                  <div className="flex items-center space-x-2">
                     <Label htmlFor={`open-${index}`} className="sr-only">Open:</Label>
                     <Input
                        id={`open-${index}`}
                        type="time"
                        value={hoursEntry.open}
                        onChange={(e) => handleTimeChange(index, 'open', e.target.value)}
                        className="w-24 text-sm"
                        disabled={!isEditing}
                     />
                     <span>-</span>
                     <Label htmlFor={`close-${index}`} className="sr-only">Close:</Label>
                     <Input
                        id={`close-${index}`}
                        type="time"
                        value={hoursEntry.close}
                        onChange={(e) => handleTimeChange(index, 'close', e.target.value)}
                        className="w-24 text-sm"
                        disabled={!isEditing}
                     />
                  </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RestaurantHours;
