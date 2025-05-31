"use client";

import { useAuth } from '../AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function PublicRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return !user ? <>{children}</> : null;
} 