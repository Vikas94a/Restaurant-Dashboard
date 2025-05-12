import React from "react";
import Link from "next/link";
import { AuthProvider } from "@/context/Authcontext";
function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <div className="w-34 bg-white shadow-lg">
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard/overview"
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/setup"
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
              >
                Setup
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/menu"
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
              >
                menu
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow"></header>
        <AuthProvider>
          <main className="p-3">{children}</main>
        </AuthProvider>
      </div>
    </div>
  );
}

export default AdminDashboardLayout;
