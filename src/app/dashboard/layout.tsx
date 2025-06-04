"use client";

import Sidebar from "@/components/Sidebar";
import { AuthGuard } from "@/providers/guards/AuthGuard";
import { ProfileCompletionGuard } from "@/providers/guards/ProfileCompletionGuard";
import { useAppSelector } from "@/store/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { restaurantDetails, isLoading } = useAppSelector((state) => state.auth);

  // Check if restaurant details are missing
  const hasRestaurantDetails = restaurantDetails?.streetName && 
    restaurantDetails?.city && 
    restaurantDetails?.zipCode && 
    restaurantDetails?.phoneNumber && 
    restaurantDetails?.restaurantType;

  // Redirect to overview if restaurant details are missing and not already on overview page
  useEffect(() => {
    if (!isLoading && !hasRestaurantDetails && pathname !== '/dashboard/overview') {
      router.push('/dashboard/overview');
    }
  }, [hasRestaurantDetails, isLoading, pathname, router]);

  return (
    <AuthGuard>
      <ProfileCompletionGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-56">
            {children}
          </main>
        </div>
      </ProfileCompletionGuard>
    </AuthGuard>
  );
}
