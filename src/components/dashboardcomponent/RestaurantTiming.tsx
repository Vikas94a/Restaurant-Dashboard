"use client";

import React from "react";
import { OpeningHours, day } from "./RestaurantDialog";

interface OpeningHoursProps {
  openingHours: OpeningHours[]; // Array of opening hours for each day
  setOpeningHours: React.Dispatch<React.SetStateAction<OpeningHours[]>>; // Setter to update opening hours state
}

function RestaurantTiming({
  openingHours,
  setOpeningHours,
}: OpeningHoursProps) {

  /**
   * updateHours
   * Updates the openingHours array at a specific index with new values.
   * @param index - index of the day in openingHours array
   * @param fields - key of the OpeningHours object to update (open, close, closed)
   * @param value - new value to assign (string for time or boolean for closed)
   */
  const updateHours = (
    index: number,
    fields: keyof OpeningHours,
    value: string | boolean
  ) => {
    // Create a copy of the current openingHours array
    const update = [...openingHours];
    // Update the specific field for the day at 'index'
    update[index] = { ...update[index], [fields]: value };
    // Update the state with new array
    setOpeningHours(update);
  };

  return (
    <div>
      <div>
        {/* Loop through each day to display input fields for opening hours */}
        {day.map((day, i) => (
          <div key={i} className="flex gap-4 items-center mb-2">
            {/* Display the day name with first letter capitalized */}
            <label className="w-20">
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </label>

            {/* Input for opening time */}
            <input
              type="time"
              value={openingHours[i]?.open} // Controlled value from state
              onChange={(e) => updateHours(i, "open", e.target.value)} // Update opening time on change
              disabled={openingHours[i]?.closed} // Disable if the day is marked closed
              className="border px-2"
              required
            />

            {/* Input for closing time */}
            <input
              type="time"
              value={openingHours[i]?.close} // Controlled value from state
              onChange={(e) => updateHours(i, "close", e.target.value)} // Update closing time on change
              disabled={openingHours[i]?.closed} // Disable if the day is marked closed
              className="border px-2"
              required
            />

            {/* Checkbox to mark the day as closed */}
            <label>
              <input
                type="checkbox"
                checked={openingHours[i]?.closed} // Controlled checkbox state
                onChange={(e) => updateHours(i, "closed", e.target.checked)} // Update closed status on toggle
              />
              Closed
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RestaurantTiming;
