"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";

// Create the context
interface AuthContextType {
  user: any;
  loading: boolean;
  error: any;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  restaurantDetails?: Restaurant;
  restaurantName:string
}

export const AppContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<Restaurant>();
  const [restaurantName, setRestaurantName] = useState("");
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const refUserDoc = doc(db, "users", firebaseUser.uid);
          const docSnapshot = await getDoc(refUserDoc);
          if (docSnapshot.exists()) {
            setUser({ uid: firebaseUser.uid, ...docSnapshot.data() });
          } else {
            setUser(null);
          }
        } catch (err) {
          setError(err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function seeData() {
      if (loading) return;

      if (!user) {
        console.log("Please log in");
        return;
      }

      const userId = user.uid;
      setRestaurantName(user.restaurantName);

      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", userId)
      );

      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const restaurantDoc = querySnapshot.docs[0]; // assuming one restaurant per user
          const restaurantData = restaurantDoc.data() as Restaurant;
          restaurantData.restaurantId = restaurantDoc.id;

          setRestaurantDetails(restaurantData);
        } else {
          console.log("No restaurant found for this user.");
        }
      } catch (error) {
        console.error("Error getting documents: ", error);
      }
    }
    //
    seeData();
  }, [user, loading]);

  return (
    <AppContext.Provider
      value={{ user, loading, error, setLoading, restaurantDetails, restaurantName }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for using the context
export function useAuth() {
  return useContext(AppContext);
}
