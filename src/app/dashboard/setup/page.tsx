"use client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ensure `db` is exported from firebase.ts
import { useEffect, useState, useContext } from "react";
import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";
import { AppContext } from "@/context/Authcontext";
import RestaurantDetails from "@/components/dashboardcomponent/ReataurantDetails";
import RestaurantHours from "@/components/dashboardcomponent/RestaurantHours";

export default function RestaurantTest() {
  const [restaurantDetails, setRestaurantDetails] = useState<Restaurant>();
  const [restaurantName, setRestaurantName] = useState("");
  const context = useContext(AppContext);

  useEffect(() => {
    async function seeData() {
      if (context?.loading) return;

      if (!context?.user) {
        console.log("Please log in");
        return;
      }

      const userId = context.user.uid;
      setRestaurantName(context.user.restaurantName);

      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", userId)
      );

      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const restaurantDoc = querySnapshot.docs[0]; // assuming one restaurant per user
          setRestaurantDetails(restaurantDoc.data() as Restaurant);
        } else {
          console.log("No restaurant found for this user.");
        }
      } catch (error) {
        console.error("Error getting documents: ", error);
      }
    }
    //
    seeData();
  }, [context?.user, context?.loading]);

  console.log(restaurantName);
  return (
    <div className="flex flex-col items-center min-h-screen">
      <h1 className="flex items-center justify-center p-4 text-blue-500 text-3xl font-bold">
        {restaurantName}
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
