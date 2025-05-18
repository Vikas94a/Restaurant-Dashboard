"use client";
import { useState, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { AppContext } from "@/context/Authcontext";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import LogIn from "./LogIn";

function NavBar() {
  const [isopen, setIsOpen] = useState(false);
  const context = useContext(AppContext);

  if (!context) return null;

  const { user, loading } = context;
  const userInitials =
    user?.firstName?.[0]?.toUpperCase() + user?.lastName?.[0]?.toUpperCase() ||
    "AA";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md p-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              width={110}
              height={50}
              alt="AI Eat Easy Logo"
              className="object-contain hover:opacity-80 transition"
            />
          </Link>

          {/* Right Side: Login / Avatar */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            ) : !user ? (
              <>
                <Button
                  onClick={() => setIsOpen(true)}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="cursor-pointer ring-1 ring-gray-200 hover:ring-blue-500 transition-all">
                    <AvatarImage
                      src={user.photoURL || "https://github.com/shadcn.png"}
                      alt={user.firstName || "User"}
                      className="rounded-full"
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 shadow-xl rounded-xl border border-gray-100">
                  <div className="space-y-1 pb-3 border-b">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                      {user.restaurantName || "Restaurant Name"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <div className="pt-3 flex flex-col space-y-2">
                    <Link href="/dashboard">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                      >
                        Dashboard
                      </Button>
                    </Link>
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

      {/* Login modal */}
      <LogIn isOpen={isopen} setIsOpen={setIsOpen} />
    </nav>
  );
}

export default NavBar;
