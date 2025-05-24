"use client";

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { initializeAuth } from '@/store/features/authSlice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log('[AuthProvider] Initializing auth...');
    
    // Initialize auth
    const unsubscribe = dispatch(initializeAuth());
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log('[AuthProvider] Cleaning up auth...');
      // The unsubscribe function is returned by the onAuthStateChanged callback
      // and is automatically called by Firebase when the component unmounts
      // No need to call it explicitly here as it's handled by Firebase
    };
  }, [dispatch]);

  return <>{children}</>;
}