"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faClipboardList,
  faBookOpen,
  faUsers,
  faCog,
  faUtensils,
  faSignOutAlt,
  faBars,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faVolumeUp,
  faVolumeMute,
  faBrain,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/features/authSlice";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@headlessui/react";
import { useSoundNotification } from "@/providers/SoundNotificationProvider";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: number;
  color: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const Sidebar = ({ isOpen = true, onToggle, isMobile = false, onCollapseChange }: SidebarProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { soundEnabled, toggleSound } = useSoundNotification();

  // Mock data for badges - replace with real data from your store
  const mockBadges = {
    orders: 3,
    reservations: 1,
  };

  // Navigation sections with logical grouping
  const navigationSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: faTachometerAlt,
          color: "blue"
        },
        {
          href: "/dashboard/orders",
          label: "Orders",
          icon: faClipboardList,
          badge: mockBadges.orders,
          color: "blue"
        }
      ]
    },
    {
      title: "Management",
      items: [
        {
          href: "/dashboard/menu",
          label: "Menu",
          icon: faBookOpen,
          color: "green"
        },
        {
          href: "/dashboard/reservations",
          label: "Reservations",
          icon: faCalendarAlt,
          badge: mockBadges.reservations,
          color: "green"
        },
        {
          href: "/dashboard/staff",
          label: "Staff",
          icon: faUsers,
          color: "green"
        }
      ]
    },
    {
      title: "Insights & Analytics",
      items: [
        {
          href: "/dashboard/ai-insight",
          label: "AI Insight",
          icon: faBrain,
          color: "purple"
        }
      ]
    },
    {
      title: "Settings",
      items: [
        {
          href: "/dashboard/settings",
          label: "Settings",
          icon: faCog,
          color: "gray"
        }
      ]
    }
  ];

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
        onCollapseChange?.(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onCollapseChange]);

  const handleSignOut = async () => {
    try {
      // First, redirect to home page
      router.replace('/');
      
      // Then perform logout
      await dispatch(logout());
      
      // Force a hard refresh to clear all state
      window.location.href = '/';
    } catch (error) {
      // Handle error silently
    }
  };

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  // Get color classes based on color prop
  const getColorClasses = (color: string, isActive: boolean = false) => {
    const baseClasses = "transition-colors duration-150 ease-in-out";
    
    if (isActive) {
      switch (color) {
        case "blue":
          return `${baseClasses} bg-blue-100 text-blue-700 border-r-2 border-blue-600`;
        case "green":
          return `${baseClasses} bg-green-100 text-green-700 border-r-2 border-green-600`;
        case "purple":
          return `${baseClasses} bg-purple-100 text-purple-700 border-r-2 border-purple-600`;
        case "gray":
          return `${baseClasses} bg-gray-100 text-gray-700 border-r-2 border-gray-600`;
        default:
          return `${baseClasses} bg-blue-100 text-blue-700 border-r-2 border-blue-600`;
      }
    }

    switch (color) {
      case "blue":
        return `${baseClasses} text-gray-700 hover:bg-blue-50 hover:text-blue-700`;
      case "green":
        return `${baseClasses} text-gray-700 hover:bg-green-50 hover:text-green-700`;
      case "purple":
        return `${baseClasses} text-gray-700 hover:bg-purple-50 hover:text-purple-700`;
      case "gray":
        return `${baseClasses} text-gray-700 hover:bg-gray-50 hover:text-gray-700`;
      default:
        return `${baseClasses} text-gray-700 hover:bg-blue-50 hover:text-blue-700`;
    }
  };

  const getIconColor = (color: string, isActive: boolean = false) => {
    if (isActive) {
      switch (color) {
        case "blue": return "text-blue-600";
        case "green": return "text-green-600";
        case "purple": return "text-purple-600";
        case "gray": return "text-gray-600";
        default: return "text-blue-600";
      }
    }

    switch (color) {
      case "blue": return "text-gray-400 group-hover:text-blue-600";
      case "green": return "text-gray-400 group-hover:text-green-600";
      case "purple": return "text-gray-400 group-hover:text-purple-600";
      case "gray": return "text-gray-400 group-hover:text-gray-600";
      default: return "text-gray-400 group-hover:text-blue-600";
    }
  };

  // Mobile sidebar classes
  const mobileClasses = isMobile 
    ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : '';

  // Desktop sidebar classes
  const desktopClasses = !isMobile 
    ? `fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`
    : '';

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`${mobileClasses} ${desktopClasses} bg-white/95 backdrop-blur-md shadow-xl border-r border-gray-200 flex flex-col`}>
        {/* Logo/Header */}
        <div className={`flex items-center py-6 border-b border-gray-200 ${
          isCollapsed ? 'px-3' : 'px-6'
        }`}>
          <div className="flex items-center">
            <FontAwesomeIcon
              icon={faUtensils}
              className="w-7 h-7 text-blue-600 flex-shrink-0"
              aria-hidden="true"
            />
            {(!isCollapsed || isMobile) && (
              <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">
                AI Eat Easy
              </span>
            )}
          </div>
          
          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={onToggle}
              className="ml-auto p-2 rounded-md hover:bg-gray-100 transition-colors duration-150"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          {/* Desktop collapse button */}
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="ml-auto p-2 rounded-md hover:bg-gray-100 transition-colors duration-150"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FontAwesomeIcon 
                icon={isCollapsed ? faChevronRight : faChevronLeft} 
                className="w-4 h-4 text-gray-600" 
              />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`flex-grow overflow-y-auto ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}
          role="navigation"
          aria-label="Main Navigation"
        >
          <div className="py-4 space-y-6">
            {navigationSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2">
                {/* Section Header */}
                {(!isCollapsed || isMobile) && (
                  <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                
                {/* Section Items */}
                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const isActive = pathname === item.href;
                    const isDashboardActive = pathname === "/dashboard" && item.href === "/dashboard";
                    const isActiveItem = isActive || isDashboardActive;
                    
                    return (
                      <li key={itemIndex}>
                        <Link
                          href={item.href}
                          className={`group flex items-center gap-3 py-2.5 rounded-lg font-medium transition-all duration-150 ease-in-out ${
                            isCollapsed ? 'px-2 justify-center' : 'px-3'
                          } ${getColorClasses(item.color, isActiveItem)}`}
                          aria-current={isActiveItem ? "page" : undefined}
                        >
                          <div className="relative flex-shrink-0">
                            <FontAwesomeIcon
                              icon={item.icon}
                              className={`w-5 h-5 transition-colors duration-150 ease-in-out ${getIconColor(item.color, isActiveItem)}`}
                              aria-hidden="true"
                            />
                            {/* Badge */}
                            {item.badge && item.badge > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </div>
                          
                          {(!isCollapsed || isMobile) && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom Controls */}
        <div className="border-t border-gray-200 space-y-1">
          {/* Sound Controls */}
          <div className={`py-2 ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}>
            <Button
              onClick={toggleSound}
              className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out group ${
                isCollapsed ? 'px-2 justify-center' : 'px-3'
              }`}
            >
              <FontAwesomeIcon
                icon={soundEnabled ? faVolumeUp : faVolumeMute}
                className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-150 ease-in-out flex-shrink-0"
                aria-hidden="true"
              />
              {(!isCollapsed || isMobile) && (
                <span className="text-sm">Sound: {soundEnabled ? 'On' : 'Off'}</span>
              )}
            </Button>
          </div>

          {/* Sign Out Button */}
          <div className={`py-2 ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}>
            <Button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition duration-150 ease-in-out group ${
                isCollapsed ? 'px-2 justify-center' : 'px-3'
              }`}
            >
              <FontAwesomeIcon
                icon={faSignOutAlt}
                className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors duration-150 ease-in-out flex-shrink-0"
                aria-hidden="true"
              />
              {(!isCollapsed || isMobile) && (
                <span className="text-sm">Sign Out</span>
              )}
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className={`py-4 border-t border-gray-200 hover:bg-gray-50 transition duration-150 ease-in-out ${
          isCollapsed ? 'px-3' : 'px-6'
        }`}>
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-semibold text-white text-sm uppercase flex-shrink-0 shadow-sm">
                {user.firstName?.charAt(0) || ""}
                {user.lastName?.charAt(0) || ""}
              </div>
              {(!isCollapsed || isMobile) && (
                <div className="leading-tight min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold text-gray-900 truncate"
                    title={user.restaurantName || "Restaurant Name"}
                  >
                    {user.restaurantName || "Restaurant Name"}
                  </p>
                  <p
                    className="text-xs text-gray-500 truncate"
                    title={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                  >
                    {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
