"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/context/Authcontext";

const ConditionalNavBar = ({ children }: { children: React.ReactNode }) => {
  const context = useAuth();

  // Check if context is null before accessing properties
  if (!context || context.loading) {
    // Optionally render a loading state or nothing while checking auth
    return null;
  }

  return (
    <>
      {!context.user && <NavBar />}
      {children}
    </>
  );
};

export default ConditionalNavBar; 