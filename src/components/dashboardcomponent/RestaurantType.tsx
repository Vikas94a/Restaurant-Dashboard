import React from 'react'
import { Input } from '../ui/input'
import { Label } from '@radix-ui/react-label'
import { Restaurant } from './RestaurantDialog'

type RestaurantTypeProps = {
    restaurantData: Restaurant;
    setRestaurantData: React.Dispatch<React.SetStateAction<Restaurant>>;
  };

function RestaurantType({restaurantData, setRestaurantData}:RestaurantTypeProps) {
  return (
    <div>
        <h3>Restaurant type</h3>
        <div>
            <Label></Label>
<Input type='restaurantType'   />
        </div>
    </div>
  )
}

export default RestaurantType