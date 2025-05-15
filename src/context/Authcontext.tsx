"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Create the context
interface AuthContextType {
  user: any;
  loading: boolean;
  error: any;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<any>(null);

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

  return (
    <AppContext.Provider value={{ user, loading, error, setLoading }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for using the context
export function useAuth() {
  return useContext(AppContext);
}
