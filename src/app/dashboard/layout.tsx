"use client";

import Sidebar from "@/components/Sidebar";
import QuickActionsBar from "@/components/QuickActionsBar";
import DashboardHeader from "@/components/DashboardHeader";
import { AuthGuard } from "@/providers/guards/AuthGuard";
import { ProfileCompletionGuard } from "@/providers/guards/ProfileCompletionGuard";
import { useGlobalOrderListener } from "@/hooks/useGlobalOrderListener";
import { useGlobalReservationListener } from "@/hooks/useGlobalReservationListener";
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
  
  // Initialize global reservation listener for sound notifications
  useGlobalReservationListener();

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

  // Don't show header on overview page (setup page)
  const showHeader = pathname !== '/dashboard/overview';

  return (
    <AuthGuard>
      <ProfileCompletionGuard>
        <div className="flex min-h-screen bg-gray-50">
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
                : 'ml-64' // Expanded sidebar width (256px)
          }`}>
            {/* Mobile top padding to account for menu button */}
            {isMobile && <div className="h-16" />}
            
            {/* Dashboard Header */}
            {showHeader && <DashboardHeader />}
            
            {/* Page Content */}
            <div className="min-h-screen">
              {children}
            </div>
          </main>

          {/* Quick Actions Bar */}
          {showHeader && <QuickActionsBar />}
        </div>
      </ProfileCompletionGuard>
    </AuthGuard>
  );
}
