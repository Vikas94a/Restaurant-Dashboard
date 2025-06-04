"use client";

import { useAuth } from '../AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useAppDispatch } from '@/store/hooks';
import { fetchUserData, fetchRestaurantData } from '@/store/features/authSlice';

export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const restaurantDetails = useAppSelector((state) => state.auth.restaurantDetails);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    const initializeUserData = async () => {
      if (!authLoading && user && !restaurantDetails) {
        try {
          const userData = await dispatch(fetchUserData(user)).unwrap();
          if (userData) {
            await dispatch(fetchRestaurantData(userData.uid)).unwrap();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    initializeUserData();
  }, [user, authLoading, dispatch, restaurantDetails]);

  useEffect(() => {
    if (!authLoading && !isLoading && user && !restaurantDetails) {
      router.push('/dashboard/overview');
    }
  }, [user, authLoading, isLoading, router, restaurantDetails]);

  if (authLoading || isLoading) {
    return null;
  }

  return user ? <>{children}</> : null;
} 