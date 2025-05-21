"use client";

import { useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppDispatch } from '@/store/hooks';
import { fetchUserData, fetchRestaurantData, logout } from '@/store/features/authSlice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await dispatch(fetchUserData(firebaseUser)).unwrap();
        if (userData) {
          dispatch(fetchRestaurantData(userData.uid));
        }
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
} 