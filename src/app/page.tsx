"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAppSelector } from "@/store/hooks";
import { ArrowRight, Info } from "lucide-react";
import { PublicRouteGuard } from "@/providers/guards/PublicRouteGuard";

export default function Home() {
  const user = useAppSelector((state) => state.auth.user);
  return (
    <PublicRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex items-center">
        <section className="max-w-7xl mx-auto px-6 py-24 md:py-32 bg-white rounded-3xl shadow-xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="text-center md:text-left space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-gray-900">
                Discover where your restaurant is <br />
                <span className="text-blue-600">losing sales</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto md:mx-0">
                Get smart insights into your restaurant&apos;s online presence and
                optimize for higher revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
                <Button className="px-7 py-3 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200 shadow-md flex items-center gap-2">
                  Get Started <ArrowRight size={18} />
                </Button>
                <Button
                  variant="outline"
                  className="px-7 py-3 text-base font-semibold border-gray-300 text-gray-700 hover:border-gray-400 hover:text-black rounded-full transition-all duration-200 flex items-center gap-2"
                >
                  Learn More <Info size={18} />
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative w-full h-[400px]">
              <Image
                src="/images/hero.png"
                alt="Restaurant Analytics Dashboard"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </section>
      </div>
    </PublicRouteGuard>
  );
}
