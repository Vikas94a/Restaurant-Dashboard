"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faClipboardList,
  faBookOpen,
  faChartLine,
  faUsers,
  faCog,
  faUtensils,
  faSignOutAlt,
  faBars,
  faTimes,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/features/authSlice";
import { useRouter } from "next/navigation";
import { Button } from "@headlessui/react";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

const Sidebar = ({ isOpen = true, onToggle, isMobile = false, onCollapseChange }: SidebarProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      console.error('Error during sign out:', error);
    }
  };

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
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
        isCollapsed ? 'w-20' : 'w-60'
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
      <div className={`${mobileClasses} ${desktopClasses} bg-white/90 backdrop-blur-md shadow-xl border-r border-gray-200 flex flex-col`}>
        {/* Logo/Header */}
        <div className={`flex items-center py-5 border-b border-gray-200 ${
          isCollapsed ? 'px-3' : 'px-6'
        }`}>
          <FontAwesomeIcon
            icon={faUtensils}
            className="w-6 h-6 text-blue-600 flex-shrink-0"
            aria-hidden="true"
          />
          {(!isCollapsed || isMobile) && (
            <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">
              AI Eat Easy
            </span>
          )}
          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={onToggle}
              className="ml-auto p-1 rounded-md hover:bg-gray-100"
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
          className={`mt-6 flex-grow ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}
          role="navigation"
          aria-label="Main Navigation"
        >
          <ul className="space-y-1">
            {/* Dashboard */}
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 py-2.5 rounded-lg text-blue-700 font-medium hover:bg-blue-200 transition duration-150 ease-in-out ${
                  isCollapsed ? 'px-2 justify-center' : 'px-4'
                }`}
                aria-current="page"
              >
                <FontAwesomeIcon
                  icon={faTachometerAlt}
                  className="w-5 h-5 flex-shrink-0"
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobile) && <span>Dashboard</span>}
              </Link>
            </li>

            {/* Orders */}
            <li>
              <Link
                href="/dashboard/orders"
                className={`flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group ${
                  isCollapsed ? 'px-2 justify-center' : 'px-4'
                }`}
              >
                <FontAwesomeIcon
                  icon={faClipboardList}
                  className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out flex-shrink-0"
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobile) && <span>Orders</span>}
              </Link>
            </li>

            {/* Menu */}
            <li>
              <Link
                href="/dashboard/menu"
                className={`flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group ${
                  isCollapsed ? 'px-2 justify-center' : 'px-4'
                }`}
              >
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out flex-shrink-0"
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobile) && <span>Menu</span>}
              </Link>
            </li>

            {/* Analytics */}
            <li>
              <Link
                href="/dashboard/analytics"
                className={`flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group ${
                  isCollapsed ? 'px-2 justify-center' : 'px-4'
                }`}
              >
                <FontAwesomeIcon
                  icon={faChartLine}
                  className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out flex-shrink-0"
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobile) && <span>Analytics</span>}
              </Link>
            </li>

            {/* AI Insight */}
            <li>
              <Link
                href="/dashboard/ai-insight"
                className={`flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-purple-100 hover:text-purple-700 transition duration-150 ease-in-out group ${
                  isCollapsed ? 'px-2 justify-center' : 'px-4'
                }`}
              >
                <FontAwesomeIcon
                  icon={faChartLine}
                  className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors duration-150 ease-in-out flex-shrink-0"
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobile) && <span>AI Insight</span>}
              </Link>
            </li>

            {/* Staff */}
            <li>
              <Link
                href="/dashboard/staff"
                className={`flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group ${
                  isCollapsed ? 'px-2 justify-center' : 'px-4'
                }`}
              >
                <FontAwesomeIcon
                  icon={faUsers}
                  className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out flex-shrink-0"
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobile) && <span>Staff</span>}
              </Link>
            </li>

            {/* Settings */}
            <li>
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group ${
                  isCollapsed ? 'px-2 justify-center' : 'px-4'
                }`}
              >
                <FontAwesomeIcon
                  icon={faCog}
                  className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out flex-shrink-0"
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobile) && <span>Settings</span>}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className={`py-2 border-t border-gray-200 ${
          isCollapsed ? 'px-2' : 'px-4'
        }`}>
          <Button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-700 transition duration-150 ease-in-out group ${
              isCollapsed ? 'px-2 justify-center' : 'px-4'
            }`}
          >
            <FontAwesomeIcon
              icon={faSignOutAlt}
              className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors duration-150 ease-in-out flex-shrink-0"
              aria-hidden="true"
            />
            {(!isCollapsed || isMobile) && <span>Sign Out</span>}
          </Button>
        </div>

        {/* User Profile */}
        <div className={`py-5 border-t border-gray-200 mt-auto hover:bg-gray-50 transition duration-150 ease-in-out ${
          isCollapsed ? 'px-3' : 'px-6'
        }`}>
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-semibold text-white text-sm uppercase flex-shrink-0">
                {user.firstName?.charAt(0) || ""}
                {user.lastName?.charAt(0) || ""}
              </div>
              {(!isCollapsed || isMobile) && (
                <div className="leading-tight min-w-0">
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
