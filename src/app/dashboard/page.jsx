import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faBookOpen,
  faBrain,
  faCalendarAlt,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

function AdminDashboard() {
  const quickActions = [
    {
      title: "Manage Orders",
      description: "View and process incoming orders",
      icon: faClipboardList,
      href: "/dashboard/orders",
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200"
    },
    {
      title: "Menu Management",
      description: "Update your menu items and categories",
      icon: faBookOpen,
      href: "/dashboard/menu",
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200"
    },
    {
      title: "AI Insights",
      description: "Generate AI-powered marketing posts",
      icon: faBrain,
      href: "/dashboard/ai-insight",
      color: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      borderColor: "border-purple-200"
    },
    {
      title: "Reservations",
      description: "Manage table reservations",
      icon: faCalendarAlt,
      href: "/dashboard/reservations",
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200"
    },
    {
      title: "Staff Management",
      description: "Manage your team and permissions",
      icon: faUsers,
      href: "/dashboard/staff",
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to your Dashboard
        </h2>
        <p className="text-gray-600">
          Everything you need to manage your restaurant is right here. Use the quick actions below or navigate through the sidebar.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`group block p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 ${action.bgColor} ${action.borderColor} hover:border-${action.color}-300`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.bgColor} ${action.textColor} group-hover:scale-110 transition-transform duration-200`}>
                <FontAwesomeIcon icon={action.icon} className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          💡 Quick Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-semibold">•</span>
            <span>Use the floating quick actions button (bottom right) for instant access to common tasks</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-600 font-semibold">•</span>
            <span>Check the AI Insights section for automated marketing post generation</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-semibold">•</span>
            <span>Monitor your daily stats in the header to track restaurant performance</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-600 font-semibold">•</span>
            <span>Use the sidebar to quickly navigate between different sections</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
