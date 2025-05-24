"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { useAppSelector } from "@/store/hooks";
import { usePathname } from 'next/navigation';

const ConditionalNavBar = ({ children }: { children: React.ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const pathname = usePathname();

  if (loading) {
    return null;
  }

  const showNavBar = pathname === '/' && !user;

  return (
    <>
      {showNavBar && <NavBar />}
      {children}
    </>
  );
};

export default ConditionalNavBar;
