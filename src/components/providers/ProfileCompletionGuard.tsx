"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { LoadingSpinner } from '@/components/dashboardcomponent/LoadingSpinner';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

export function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const router = useRouter();
  const { user, restaurantDetails, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!loading && user && !restaurantDetails) {
      router.push('/dashboard/overview');
    }
  }, [user, restaurantDetails, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !restaurantDetails) {
    return null;
  }

  return <>{children}</>;
} 