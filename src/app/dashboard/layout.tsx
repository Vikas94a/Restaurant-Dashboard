"use client";

import Sidebar from "@/components/Sidebar";
import { AuthGuard } from "@/providers/guards/AuthGuard";
import { ProfileCompletionGuard } from "@/providers/guards/ProfileCompletionGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ProfileCompletionGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-56">
            {children}
          </main>
        </div>
      </ProfileCompletionGuard>
    </AuthGuard>
  );
}
