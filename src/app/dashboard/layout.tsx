"use client";

import Sidebar from "@/components/Sidebar";
import { AuthGuard } from "@/providers/guards/AuthGuard";
import { ProfileCompletionGuard } from "@/providers/guards/ProfileCompletionGuard";
import { useGlobalOrderListener } from "@/hooks/useGlobalOrderListener";
import { useAppSelector } from "@/store/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { restaurantDetails, isLoading } = useAppSelector((state) => state.auth);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize global order listener for sound notifications
  useGlobalOrderListener();

  // Check if restaurant details are missing
  const hasRestaurantDetails = restaurantDetails?.streetName && 
    restaurantDetails?.city && 
    restaurantDetails?.zipCode && 
    restaurantDetails?.phoneNumber && 
    restaurantDetails?.restaurantType;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect to overview if restaurant details are missing and not already on overview page
  useEffect(() => {
    if (!isLoading && !hasRestaurantDetails && pathname !== '/dashboard/overview') {
      router.push('/dashboard/overview');
    }
  }, [hasRestaurantDetails, isLoading, pathname, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarCollapseChange = (isCollapsed: boolean) => {
    setSidebarCollapsed(isCollapsed);
  };

  return (
    <AuthGuard>
      <ProfileCompletionGuard>
        <div className="flex min-h-screen">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Sidebar */}
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={toggleSidebar} 
            isMobile={isMobile} 
            onCollapseChange={handleSidebarCollapseChange}
          />

          {/* Main content */}
          <main className={`flex-1 transition-all duration-300 ease-in-out ${
            isMobile 
              ? 'ml-0' 
              : sidebarCollapsed 
                ? 'ml-20' // Collapsed sidebar width (80px)
                : 'ml-60' // Expanded sidebar width (240px)
          }`}>
            {/* Mobile top padding to account for menu button */}
            {isMobile && <div className="h-16" />}
            {children}
          </main>
        </div>
      </ProfileCompletionGuard>
    </AuthGuard>
  );
}
