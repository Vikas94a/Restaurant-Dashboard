"use client";

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import ConditionalNavBar from "@/components/ConditionalNavBar";
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/features/authSlice';

// Component to handle auto-logout on page load if needed
const AutoLogoutHandler = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Clear any existing auth state if we're not authenticated
    const userData = localStorage.getItem('persist:root');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const authData = JSON.parse(parsed.auth || '{}');
        if (!authData.user) {
          // Clear the persisted state if no user is found
          dispatch(logout());
        }
      } catch (e) {
        console.error('Error parsing persisted state:', e);
      }
    }
  }, [dispatch]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AutoLogoutHandler>
          <AuthProvider>
            <ConditionalNavBar>{children}</ConditionalNavBar>
          </AuthProvider>
          <Toaster />
        </AutoLogoutHandler>
      </PersistGate>
    </Provider>
  );
}