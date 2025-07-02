"use client";

import { useAuth } from '../AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EmailVerificationGuard } from './EmailVerificationGuard';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  // If user exists, wrap with EmailVerificationGuard
  return user ? (
    <EmailVerificationGuard>{children}</EmailVerificationGuard>
  ) : null;
} 