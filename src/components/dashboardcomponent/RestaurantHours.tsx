import React from "react";
import { Restaurant } from "./RestaurantDialog";

type RestaurantTypeProps = {
  restaurantDetails?: Restaurant;
};

function RestaurantHours({ restaurantDetails }: RestaurantTypeProps) {
  return (
    <div>
      <div className="flex flex-col p-4 bg-gray-200 w-120 gap-7">
        {restaurantDetails?.openingHours.map((hours, index) => {
          return (
            <div key={index}>
              <p>
                {hours.day.charAt(0).toUpperCase() + hours.day.slice(1)}:
                {hours.closed ? "Closed" : `${hours.open} - ${hours.close}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RestaurantHours;
