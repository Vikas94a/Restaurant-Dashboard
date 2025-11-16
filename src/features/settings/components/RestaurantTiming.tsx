"use client";

import React from "react";
import { OpeningHours, day } from "@/features/overview/components/RestaurantDialog";
import { Label } from "@/components/ui/label";

interface OpeningHoursProps {
  openingHours: OpeningHours[];
  setOpeningHours: React.Dispatch<React.SetStateAction<OpeningHours[]>>;
}

function RestaurantTiming({
  openingHours,
  setOpeningHours,
}: OpeningHoursProps) {
  const updateHours = (
    index: number,
    fields: keyof OpeningHours,
    value: string | boolean
  ) => {
    const update = [...openingHours];
    update[index] = { ...update[index], [fields]: value };
    setOpeningHours(update);
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Opening Hours</h3>
        <p className="text-sm text-gray-500">Set your restaurant&apos;s operating hours.</p>
      </div>

      <div className="space-y-4">
        {/* Header row */}
        <div className="grid grid-cols-[120px_1fr_1fr_100px] gap-4 mb-2 text-sm font-medium text-gray-600">
          <div>Day</div>
          <div>Opening Time</div>
          <div>Closing Time</div>
          <div>Status</div>
        </div>

        {/* Days rows */}
        {day.map((day, i) => (
          <div key={i} className="grid grid-cols-[120px_1fr_1fr_100px] gap-4 items-center">
            <Label className="font-medium text-gray-700">
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Label>

            <input
              type="time"
              value={openingHours[i]?.open}
              onChange={(e) => updateHours(i, "open", e.target.value)}
              disabled={openingHours[i]?.closed}
              className="px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              required
            />

            <input
              type="time"
              value={openingHours[i]?.close}
              onChange={(e) => updateHours(i, "close", e.target.value)}
              disabled={openingHours[i]?.closed}
              className="px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              required
            />

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={openingHours[i]?.closed}
                onChange={(e) => updateHours(i, "closed", e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Closed</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RestaurantTiming;
