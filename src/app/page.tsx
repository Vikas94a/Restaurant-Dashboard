"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { AppContext } from "@/context/Authcontext";
import { useContext } from "react";

export default function Home() {
  const context = useContext(AppContext);
  if (!context) {
    console.log("Context is null");
    return null;
  }
  const { user, loading } = context;

  console.log("User:", user, loading);
  return (
    <div className="p-7">
      <section>
        <h1 className="font-bold text-4xl w-120">
          Make online growth easy for restaurant with AI
        </h1>
      </section>
    </div>
  );
}
