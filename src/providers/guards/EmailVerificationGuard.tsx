"use client";

import { useAuth } from '../AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function EmailVerificationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (!user.emailVerified) {
        router.push('/verify-email');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return user && user.emailVerified ? <>{children}</> : null;
} 