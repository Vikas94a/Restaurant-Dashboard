"use client";

import Sidebar from "@/components/Sidebar";
import { AuthGuard } from "@/components/providers/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-56">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
