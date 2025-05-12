import React from "react";
import { Restaurant } from "./RestaurantDialog";

type RestaurantTypeProps = {
  restaurantDetails?: Restaurant;
};

function ReataurantDetails({ restaurantDetails }: RestaurantTypeProps) {
  return (
    <div className="flex flex-col p-4 bg-gray-200 w-120 gap-7">
      <p>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ut, reiciendis
        expedita ratione velit necessitatibus illum quia quaerat, vitae sit
        blanditiis beatae doloribus quibusdam eos possimus excepturi, temporibus
        iure cupiditate saepe quidem exercitationem illo pariatur minima.
        Voluptatibus sapiente expedita ducimus animi ut quas, dolorum temporibus
        repudiandae reprehenderit quasi cum, nesciunt laudantium?
      </p>
      <div>
        <p>Restaurant Location</p>
        <span>{restaurantDetails?.streetName}</span>
        <span>{restaurantDetails?.zipCode}</span>
        <span>{restaurantDetails?.city}</span>
      </div>
      <div>
        <p>Phone Number: {restaurantDetails?.phoneNumber}</p>
       
      </div>
    </div>
  );
}

export default ReataurantDetails;
