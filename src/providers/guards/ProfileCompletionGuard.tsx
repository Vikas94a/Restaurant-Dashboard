"use client";

import { useAuth } from '../AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Check if user profile is complete
      const isProfileComplete = user.displayName && user.email;
      if (!isProfileComplete) {
        router.push('/profile-completion');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return user ? <>{children}</> : null;
} 