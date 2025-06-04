"use client";

import React from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/features/authSlice";
import { useRouter } from "next/navigation";
import { Button } from "@headlessui/react";

const Sidebar = () => {
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.isLoading);
  const dispatch = useAppDispatch();
  const router = useRouter();

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

  return (
    // Assume Link, FontAwesomeIcon, fa* icons, and the 'user' object
    // are imported and available in the scope where this JSX is rendered.

    <div className="w-60 bg-white/90 backdrop-blur-md shadow-xl border-r border-gray-200 fixed inset-y-0 left-0 z-30 flex flex-col">
      {/* Logo/Header */}
      <div className="flex items-center px-6 py-5 border-b border-gray-200">
        {/* UI/UX Improvement: Hide decorative icon from assistive technologies */}
        <FontAwesomeIcon
          icon={faUtensils}
          className="w-6 h-6 text-blue-600"
          aria-hidden="true"
        />
        <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">
          AI Eat Easy
        </span>
      </div>

      {/* Navigation */}
      {/* UI/UX Improvement: Added role and aria-label for better accessibility context */}
      <nav
        className="mt-6 px-4 flex-grow"
        role="navigation"
        aria-label="Main Navigation"
      >
        <ul className="space-y-1">
          {/* Dashboard (Active Example) */}
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition duration-150 ease-in-out"
              // UI/UX Improvement: Indicate current page for assistive technologies
              aria-current="page"
            >
              <FontAwesomeIcon
                icon={faTachometerAlt}
                className="w-5 h-5" // Icon color inherited from text-blue-700
                aria-hidden="true"
              />
              Dashboard
            </Link>
          </li>

          {/* Orders */}
          <li>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group"
            >
              <FontAwesomeIcon
                icon={faClipboardList}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out"
                aria-hidden="true"
              />
              Orders
            </Link>
          </li>

          {/* Menu */}
          <li>
            <Link
              href="/dashboard/menu"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group"
            >
              <FontAwesomeIcon
                icon={faBookOpen}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out"
                aria-hidden="true"
              />
              Menu
            </Link>
          </li>

          {/* Analytics */}
          <li>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group"
            >
              <FontAwesomeIcon
                icon={faChartLine}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out"
                aria-hidden="true"
              />
              Analytics
            </Link>
          </li>

          {/* Staff */}
          <li>
            <Link
              href="/dashboard/staff"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group"
            >
              <FontAwesomeIcon
                icon={faUsers}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out"
                aria-hidden="true"
              />
              Staff
            </Link>
          </li>

          {/* Settings */}
          <li>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition duration-150 ease-in-out group"
            >
              <FontAwesomeIcon
                icon={faCog}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-150 ease-in-out"
                aria-hidden="true"
              />
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* Sign Out Button */}
      <div className="px-4 py-2 border-t border-gray-200">
        <Button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-700 transition duration-150 ease-in-out group"
        >
          <FontAwesomeIcon
            icon={faSignOutAlt}
            className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors duration-150 ease-in-out"
            aria-hidden="true"
          />
          Sign Out
        </Button>
      </div>

      {/* User Profile */}
      {/* UI/UX Improvement: Added subtle hover effect for affordance if it were to become interactive */}
      <div className="px-6 py-5 border-t border-gray-200 mt-auto hover:bg-gray-50 transition duration-150 ease-in-out">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-semibold text-white text-sm uppercase">
              {/* UI/UX Improvement: Safer way to get initials, handles undefined/empty names */}
              {user.firstName?.charAt(0) || ""}
              {user.lastName?.charAt(0) || ""}
            </div>
            <div className="leading-tight">
              <p
                className="text-sm font-semibold text-gray-900 truncate"
                // UI/UX Improvement: Show full name on hover if truncated
                title={user.restaurantName || "Restaurant Name"}
              >
                {user.restaurantName || "Restaurant Name"}
              </p>
              <p
                className="text-xs text-gray-500 truncate"
                // UI/UX Improvement: Show full name on hover if truncated
                title={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
              >
                {/* UI/UX Improvement: Ensure no leading/trailing spaces if one name is missing */}
                {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
