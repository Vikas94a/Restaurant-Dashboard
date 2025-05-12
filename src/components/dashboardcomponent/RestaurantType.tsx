import React from "react";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";
import { Restaurant } from "./RestaurantDialog";

type RestaurantTypeProps = {
  restaurantData: Restaurant;
  setRestaurantData: React.Dispatch<React.SetStateAction<Restaurant>>;
  handleForm: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function RestaurantType({
  restaurantData,
  setRestaurantData,
  handleForm,
}: RestaurantTypeProps) {
  return (
    <div>
      <div>
        <div className="flex ">
          <Label>Restsurant type</Label>
          <Input
            type="restaurantType"
            name="restaurantType"
            value={restaurantData.restaurantType}
            onChange={handleForm}
            placeholder="Indian Restaurant*"
            required
          />
        </div>
      </div>
    </div>
  );
}

export default RestaurantType;
