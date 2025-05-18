"use client";

import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faClipboardList,
  faBookOpen,
  faChartLine,
  faUsers,
  faCog,
  faUtensils
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from "@/context/Authcontext"; // Import useAuth hook

const Sidebar = () => {
  const context = useAuth(); // Get the entire context object

  // Safely access user and loading from the context
  const user = context?.user;
  const loading = context?.loading;

  // Render nothing if loading, though sidebar is usually always present.
  // We will just conditionally render the user section based on 'user'.

  // Render nothing if loading, though sidebar is usually always present.
  // We will just conditionally render the user section based on 'user'.

  return (
    <div className="w-56 bg-white/90 backdrop-blur-md shadow-lg border-r border-gray-200 fixed inset-y-0 left-0 z-30 flex flex-col">
      {/* Sidebar content remains as before. */}
      {/* You can add your original user section or leave as is. */}
    
      {/* Header with Logo */}
      <div className="flex items-center px-4 py-4 border-b border-gray-200">
        <FontAwesomeIcon icon={faUtensils} className="w-6 h-6 mr-3 text-blue-600" />
        <span className="text-2xl font-extrabold text-gray-900 tracking-tight">Ai Eat Easy</span>
      </div>
      <nav className="mt-6 px-4 flex-grow">
        <ul className="space-y-2">
          {/* Dashboard Link (Active State) */}
          <li>
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-3 rounded-lg text-blue-700 bg-blue-100 transition-colors duration-200 group"
            >
              <FontAwesomeIcon icon={faTachometerAlt} className="w-5 h-5 mr-3 text-blue-600" />
              Dashboard
            </Link>
          </li>
          {/* Orders Link */}
          <li>
            <Link
              href="/dashboard/orders"
              className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors duration-200 group"
            >
              <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
              Orders
            </Link>
          </li>
          {/* Menu Link */}
          <li>
            <Link
              href="/dashboard/menu"
              className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors duration-200 group"
            >
              <FontAwesomeIcon icon={faBookOpen} className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
              Menu
            </Link>
          </li>
           {/* Analytics Link */}
           <li>
            <Link
              href="/dashboard/analytics"
              className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors duration-200 group"
            >
              <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
              Analytics
            </Link>
          </li>
           {/* Staff Link */}
           <li>
            <Link
              href="/dashboard/staff"
              className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors duration-200 group"
            >
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
              Staff
            </Link>
          </li>
          {/* Settings Link */}
          <li>
            <Link
              href="/dashboard/setup"
              className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors duration-200 group"
            >
              <FontAwesomeIcon icon={faCog} className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
              Settings
            </Link>
          </li>
        </ul>
      </nav>

       {/* User Profile Section */}
       <div className="px-4 py-4 border-t border-gray-200 mt-auto"> {/* Added mt-auto to push to bottom */}
          {user && (
             <div className="flex items-center">
                {/* Placeholder for user avatar - ideally use user.photoURL */}
                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                <div>
                   <p className="text-sm font-medium text-gray-900">{user.restaurantName || "Restaurant Name"}</p>
                   <p className="text-xs text-gray-600">{user.firstName} {user.lastName}</p>
                   {/* Optional: Link to profile page if one exists */}
                   {/* <Link href="#" className="text-xs text-blue-600 hover:underline">View profile</Link> */}
                </div>
             </div>
          )}
       </div>

    </div>
  );
};

export default Sidebar;
