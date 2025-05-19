"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Restaurant } from "@/components/dashboardcomponent/RestaurantDialog";

// Define the shape of the context data and functions
interface AuthContextType {
  user: any; // Currently logged-in user info
  loading: boolean; // Loading state for async operations
  setLoading: React.Dispatch<React.SetStateAction<boolean>>; // Setter for loading state
  error: any; // Stores any error occurred
  setError: React.Dispatch<React.SetStateAction<null>>; // Setter for error state

  restaurantDetails?: Restaurant; // Details of the user's restaurant (if any)
  restaurantName: string; // Name of the restaurant
  logout: () => Promise<void>; // Function to log the user out
}

// Create React context to share auth and restaurant data globally
export const AppContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Local state to store user, loading status, errors, restaurant details and name
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<Restaurant>();
  const [restaurantName, setRestaurantName] = useState("");

  // Logout function to sign out from Firebase auth
  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Effect to listen for Firebase auth state changes (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // Start loading whenever auth state changes

      if (firebaseUser) {
        // If user is logged in, fetch user data from Firestore 'users' collection
        try {
          const refUserDoc = doc(db, "users", firebaseUser.uid);
          const docSnapshot = await getDoc(refUserDoc);

          if (docSnapshot.exists()) {
            // Set user with Firestore data plus uid
            setUser({ uid: firebaseUser.uid, ...docSnapshot.data() });
          } else {
            // No user doc found - treat as no user
            setUser(null);
          }
        } catch (err) {
          // Error fetching user data
          setError(err);
          setUser(null);
        }
      } else {
        // No user logged in
        setUser(null);
      }

      setLoading(false); // Done loading after user info fetched or reset
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Effect to fetch restaurant data after user and loading state updated
  useEffect(() => {
    async function seeData() {
      if (loading) return; // Wait until loading finishes

      if (!user) {
        console.log("Please log in");
        return; // No user, no restaurant data to fetch
      }

      const userId = user.uid;
      setRestaurantName(user.restaurantName); // Set restaurant name from user data (if available)

      // Query Firestore 'restaurants' collection for document where 'ownerId' equals userId
      const q = query(collection(db, "restaurants"), where("ownerId", "==", userId));

      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // Assuming one restaurant per user, take the first document found
          const restaurantDoc = querySnapshot.docs[0];
          const restaurantData = restaurantDoc.data() as Restaurant;
          restaurantData.restaurantId = restaurantDoc.id; // Add doc ID to data

          setRestaurantDetails(restaurantData); // Set restaurant details in state
        } else {
          console.log("No restaurant found for this user.");
        }
      } catch (error) {
        console.error("Error getting documents: ", error);
      }
    }

    // Call function to fetch restaurant data whenever user or loading changes
    seeData();
  }, [user, loading]);

  // Provide context values to children components
  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        setLoading,
        restaurantDetails,
        restaurantName,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for consuming the auth context easily in other components
export function useAuth() {
  return useContext(AppContext);
}
