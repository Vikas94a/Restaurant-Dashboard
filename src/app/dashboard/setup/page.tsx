"use client";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ensure `db` is exported from firebase.ts
import { auth } from "@/lib/firebase";
import { useEffect, useState, useContext } from "react";
import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";
import { AppContext } from "@/context/Authcontext";
import RestaurantDetails from "@/components/dashboardcomponent/ReataurantDetails";
import RestaurantHours from "@/components/dashboardcomponent/RestaurantHours";
export default function RestaurantTest() {
  const [restaurantDetails, setrestaurantDetails] = useState<Restaurant>();
  const cotext = useContext(AppContext);
  const user = cotext;
  // console.log(user?.user.restaurantName);

  const restaurantId = "SFhFvVRfYKGj0nlLWFSk";
  useEffect(() => {
    async function fetchRestaurantDetails() {
      const refRestaurantCollection = doc(db, "restaurants", restaurantId);
      const docSnapshot = await getDoc(refRestaurantCollection);

      if (docSnapshot.exists()) {
        setrestaurantDetails(docSnapshot.data() as Restaurant);
      } else {
        console.log("No such document!");
      }
    }

    fetchRestaurantDetails();
  }, [restaurantId]);

  console.log(restaurantDetails);
  return (
    <div className="flex flex-col items-center min-h-screen">
      <h1 className="flex items-center justify-center p-4 text-blue-500 text-3xl font-bold">
        {/* {user?.user.restaurantName} */}
      </h1>
      <div className="flex items-center justify-center p-4 bg-gray-800 text-white">
        <h1 className="text-3xl font-bold">Restaurant Details</h1>
      </div>
      <div className="flex justify-between p-4 bg-gray-200">
        <div>
          <RestaurantDetails restaurantDetails={restaurantDetails} />
        </div>
        <div>
          <p>Restaurant Timing</p>
          <RestaurantHours restaurantDetails={restaurantDetails} />
        </div>
      </div>
    </div>
  );
}
