"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/features/authSlice';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    // Clear any existing persisted data
    const clearPersistedData = () => {
      // Clear localStorage items
      localStorage.removeItem('persist:root');
      // Clear sessionStorage items
      sessionStorage.clear();
    };

    // Set up auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // If no user, clear all persisted data
        clearPersistedData();
        dispatch(logout());
      } else {
        // If user exists, verify the session
        try {
          // Force token refresh to ensure session is valid
          await user.getIdToken(true);
          setUser(user);
        } catch (error) {
          // If session is invalid, sign out
          await signOut(auth);
          clearPersistedData();
          dispatch(logout());
        }
      }
      setLoading(false);
    });

    // Set up token refresh listener
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if token is about to expire (within 5 minutes)
          const decodedToken = await user.getIdTokenResult();
          const expirationTime = new Date(decodedToken.expirationTime).getTime() / 1000;
          const currentTime = new Date().getTime() / 1000;
          
          if (expirationTime && expirationTime - currentTime < 300) { // 5 minutes
            // Token is about to expire, refresh it
            await user.getIdToken(true);
            }
        } catch (error) {
          // If token refresh fails, sign out
          await signOut(auth);
          clearPersistedData();
          dispatch(logout());
          toast.error('Your session has expired. Please sign in again.');
        }
      }
    });

    // Set loading to false after a timeout if auth state hasn't changed
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      clearTimeout(timeoutId);
    };
  }, [dispatch, loading]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 