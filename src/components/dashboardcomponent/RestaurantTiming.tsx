import React from "react";
import { Label } from "@radix-ui/react-label";
import { OpeningHours, day } from "./RestaurantDialog";

interface OpeningHoursProps {
  openingHours: OpeningHours[];
  setOpeningHours: React.Dispatch<React.SetStateAction<OpeningHours[]>>;
}

function RestaurantTiming({
  openingHours,
  setOpeningHours,
}: OpeningHoursProps) {
  // const day = [
  //   "sunday",
  //   "monday",
  //   "tuesday",
  //   "wednesday",
  //   "thursday",
  //   "friday",
  //   "saturday",
  // ];

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
    <div>
      <div>
        {day.map((day, i) => (
          <div key={i} className="flex gap-4 items-center mb-2">
            <label className="w-20">
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </label>
            <input
              type="time"
              value={openingHours[i]?.open}
              onChange={(e) => updateHours(i, "open", e.target.value)}
              disabled={openingHours[i]?.closed}
              className="border px-2"
              required
            />
            <input
              type="time"
              value={openingHours[i]?.close}
              onChange={(e) => updateHours(i, "close", e.target.value)}
              disabled={openingHours[i]?.closed}
              className="border px-2"
              required
            />
            <label>
              <input
                type="checkbox"
                checked={openingHours[i]?.closed}
                onChange={(e) => updateHours(i, "closed", e.target.checked)}
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
