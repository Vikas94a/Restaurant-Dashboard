"use client";

import { ReduxProvider } from "@/providers/ReduxProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SoundNotificationProvider } from "@/providers/SoundNotificationProvider";
import { Toaster } from "@/components/ui/sonner";
import NavBar from "@/components/NavBar";
import { useState, useEffect } from 'react';
import { SessionWarningModal } from '@/components/auth/SessionWarningModal';
import { usePathname } from 'next/navigation';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show navbar on the home page
  const showNavbar = pathname === '/';

  return (
    <ReduxProvider>
      <AuthProvider>
        <SoundNotificationProvider>
          {showNavbar && <NavBar />}
          {children}
          <SessionWarningModal />
          {mounted && <Toaster />}
        </SoundNotificationProvider>
      </AuthProvider>
    </ReduxProvider>
  );
} 