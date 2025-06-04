"use client";

import { ReduxProvider } from "@/providers/ReduxProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect } from 'react';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ReduxProvider>
      <AuthProvider>
        {children}
        {mounted && <Toaster />}
      </AuthProvider>
    </ReduxProvider>
  );
} 