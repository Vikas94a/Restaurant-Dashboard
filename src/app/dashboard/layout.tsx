import React from "react";
import { AuthProvider } from "@/context/Authcontext";
import Sidebar from "@/components/Sidebar";

function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-56 overflow-auto bg-white/80 backdrop-blur-sm">
        <AuthProvider>
          <main className="p-8">{children}</main>
        </AuthProvider>
      </div>
    </div>
  );
}

export default AdminDashboardLayout;
