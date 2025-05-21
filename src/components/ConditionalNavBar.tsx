"use client";

import React from "react";
import NavBar from "@/components/NavBar";
import { useAppSelector } from "@/store/hooks";

const ConditionalNavBar = ({ children }: { children: React.ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  if (loading) {
    return null;
  }

  return (
    <>
      {!user && <NavBar />}
      {children}
    </>
  );
};

export default ConditionalNavBar;
