"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { LoadingSpinner } from '@/components/dashboardcomponent/LoadingSpinner';

interface PublicRouteGuardProps {
  children: React.ReactNode;
}

export function PublicRouteGuard({ children }: PublicRouteGuardProps) {
  const router = useRouter();
  const { user, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
} 