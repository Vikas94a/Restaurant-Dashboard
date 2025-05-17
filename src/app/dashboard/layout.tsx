import React from "react";
import Link from "next/link";
import { AuthProvider } from "@/context/Authcontext";

function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      <div className="w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-gray-100">
        <nav className="mt-8 px-4">
          <div className="mb-8 px-4">
            <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Restaurant Management</p>
          </div>
          <ul className="space-y-3">
            <li>
              <Link
                href="/dashboard/setup"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all duration-200 group"
              >
                <svg
                  className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Setup
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/menu"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all duration-200 group"
              >
                <svg
                  className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Menu
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all duration-200 group"
              >
                <svg
                  className="w-5 h-5 mr-3 text-gray-400 group-hover:text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 h-16 flex items-center px-8 shadow-sm sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-gray-800">AI Eat Easy</h1>
        </header>
        <AuthProvider>
          <main className="p-6">{children}</main>
        </AuthProvider>
      </div>
    </div>
  );
}

export default AdminDashboardLayout;
