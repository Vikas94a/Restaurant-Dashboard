"use client"; // Next.js directive to mark this file as client-side only

import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "./ui/button";
import Image from "next/image";
import { useState } from "react";
import Login from "./LogIn";

const NavBar = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={180}
              height={60}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Nav Buttons */}
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setIsLoginOpen(true)}
              className="px-6 py-2 rounded-full text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
            >
              Login
            </Button>

            <Link href="/signup">
              <Button className="px-6 py-2 rounded-full text-sm font-medium text-white bg-black hover:bg-gray-900 transition-all duration-200 shadow-md">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Login Dialog */}
      <Login isOpen={isLoginOpen} setIsOpen={setIsLoginOpen} />
    </nav>
  );
};

export default NavBar;
