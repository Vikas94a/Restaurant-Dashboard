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

  // console.log("User:", user, loading);
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col items-center space-y-8 text-center">
          <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight max-w-3xl">
            See where your restaurant is losing sales online
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl">
            Get insights into your restaurant's online performance and boost your revenue
          </p>
          <div className="w-full max-w-4xl rounded-lg shadow-xl overflow-hidden">
            <img 
              src="/images/hero.png" 
              alt="hero image" 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="flex gap-4 mt-8">
            <Button className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Get Started
            </Button>
            <Button variant="outline" className="px-8 py-3 text-lg border-2 rounded-lg hover:bg-gray-50 transition-colors">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
