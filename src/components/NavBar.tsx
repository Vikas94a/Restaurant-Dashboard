"use client"; // Next.js directive to mark this file as client-side only

import { useState, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { AppContext } from "@/context/Authcontext"; // Custom auth context to get user info
import { auth } from "@/lib/firebase"; // Firebase auth instance

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import LogIn from "./LogIn"; // Login modal component

function NavBar() {
  // State to control visibility of the Login modal
  const [isopen, setIsOpen] = useState(false);

  // Access the auth context to get user info and loading state
  const context = useContext(AppContext);

  // If context is not available (unlikely), return null (render nothing)
  if (!context) return null;

  const { user, loading } = context;

  // Create user initials from first and last name or fallback to "AA"
  const userInitials =
    user?.firstName?.[0]?.toUpperCase() + user?.lastName?.[0]?.toUpperCase() ||
    "AA";

  return (
    // Navigation bar container with sticky positioning and backdrop blur
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md p-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo section - links back to homepage */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              width={110}
              height={50}
              alt="AI Eat Easy Logo"
              className="object-contain hover:opacity-80 transition"
            />
          </Link>

          {/* Right side - shows login/signup buttons or user avatar */}
          <div className="flex items-center gap-3">
            {loading ? (
              // Show a loading skeleton while user info is loading
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            ) : !user ? (
              // If no user is logged in, show Login and Signup buttons
              <>
                <Button
                  onClick={() => setIsOpen(true)} // Opens login modal
                  className="px-5 py-2 text-sm sm:text-base"
                  variant="outline"
                >
                  Login
                </Button>
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm sm:text-base">
                    Signup
                  </Button>
                </Link>
              </>
            ) : (
              // If user is logged in, show avatar with popover menu
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="cursor-pointer ring-1 ring-gray-200 hover:ring-blue-500 transition-all">
                    {/* User profile photo or fallback image */}
                    <AvatarImage
                      src={user.photoURL || "https://github.com/shadcn.png"}
                      alt={user.firstName || "User"}
                      className="rounded-full"
                    />
                    {/* Fallback initials if no photo available */}
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </PopoverTrigger>

                {/* Popover content with user info and links */}
                <PopoverContent className="w-72 p-4 shadow-xl rounded-xl border border-gray-100">
                  <div className="space-y-1 pb-3 border-b">
                    {/* Restaurant name or default */}
                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                      {user.restaurantName || "Restaurant Name"}
                    </h4>
                    {/* User full name */}
                    <p className="text-sm text-gray-600">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <div className="pt-3 flex flex-col space-y-2">
                    {/* Link to dashboard */}
                    <Link href="/dashboard">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                      >
                        Dashboard
                      </Button>
                    </Link>
                    {/* Logout button that signs out user */}
                    <Button
                      onClick={() => signOut(auth)}
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Logout
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      {/* Login modal component, controlled by isopen state */}
      <LogIn isOpen={isopen} setIsOpen={setIsOpen} />
    </nav>
  );
}

export default NavBar;
