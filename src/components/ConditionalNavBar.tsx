"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { useAppSelector } from "@/store/hooks";
import { usePathname } from 'next/navigation';

const ConditionalNavBar = ({ children }: { children: React.ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.isLoading);
  const pathname = usePathname();

  if (loading) {
    return null;
  }

  // Show navbar on all public routes (not in dashboard)
  const showNavBar = !pathname.startsWith('/dashboard') && !user;

  return (
    <>
      {showNavBar && <NavBar />}
      {children}
    </>
  );
};

export default ConditionalNavBar;
