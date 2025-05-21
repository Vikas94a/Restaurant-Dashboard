"use client";

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import ConditionalNavBar from "@/components/ConditionalNavBar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ConditionalNavBar>{children}</ConditionalNavBar>
      </AuthProvider>
      <Toaster />
    </Provider>
  );
} 