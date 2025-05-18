"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { AppContext } from "@/context/Authcontext";
import { useContext } from "react";
import { ArrowRight, Info } from "lucide-react";

export default function Home() {
  const context = useContext(AppContext);

  if (!context) {
    console.log("Context is null");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex items-center">
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center md:text-left space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
              Discover where your restaurant is{" "}
              <span className="text-blue-600">losing sales</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-xl">
              Get smart insights into your restaurant’s online presence and
              optimize for higher revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <Button className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                Get Started <ArrowRight size={18} />
              </Button>
              <Button
                variant="outline"
                className="px-6 py-3 text-lg border-gray-300 rounded-lg flex items-center gap-2"
              >
                Learn More <Info size={18} />
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="w-full">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/hero.png"
                alt="Hero image"
                width={800}
                height={600}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
