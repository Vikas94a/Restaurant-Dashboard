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
} from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "@/store/hooks";

const Sidebar = () => {
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  return (
    <div className="w-60 bg-white/90 backdrop-blur-md shadow-xl border-r border-gray-200 fixed inset-y-0 left-0 z-30 flex flex-col">
      {/* Logo/Header */}
      <div className="flex items-center px-6 py-5 border-b border-gray-200">
        <FontAwesomeIcon icon={faUtensils} className="w-6 h-6 text-blue-600" />
        <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">
          AI Eat Easy
        </span>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-4 flex-grow">
        <ul className="space-y-1">
          {/* Dashboard (Active Example) */}
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition"
            >
              <FontAwesomeIcon icon={faTachometerAlt} className="w-5 h-5" />
              Dashboard
            </Link>
          </li>

          {/* Orders */}
          <li>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition group"
            >
              <FontAwesomeIcon
                icon={faClipboardList}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600"
              />
              Orders
            </Link>
          </li>

          {/* Menu */}
          <li>
            <Link
              href="/dashboard/menu"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition group"
            >
              <FontAwesomeIcon
                icon={faBookOpen}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600"
              />
              Menu
            </Link>
          </li>

          {/* Analytics */}
          <li>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition group"
            >
              <FontAwesomeIcon
                icon={faChartLine}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600"
              />
              Analytics
            </Link>
          </li>

          {/* Staff */}
          <li>
            <Link
              href="/dashboard/staff"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition group"
            >
              <FontAwesomeIcon
                icon={faUsers}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600"
              />
              Staff
            </Link>
          </li>

          {/* Settings */}
          <li>
            <Link
              href="/dashboard/setup"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition group"
            >
              <FontAwesomeIcon
                icon={faCog}
                className="w-5 h-5 text-gray-400 group-hover:text-green-600"
              />
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* User Profile */}
      <div className="px-6 py-5 border-t border-gray-200 mt-auto">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold text-white text-sm uppercase">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900">
                {user.restaurantName || "Restaurant Name"}
              </p>
              <p className="text-xs text-gray-500">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
