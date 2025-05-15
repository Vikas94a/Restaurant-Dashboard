"use client";
import { useState, useContext } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { AppContext } from "@/context/Authcontext";
import Link from "next/link";
import LogIn from "./LogIn";

function NavBar() {
  const [isopen, setIsOpen] = useState<boolean>(false);
  const context = useContext(AppContext);

  if (!context) {
    return null;
  }
  const { user } = context;

  function handleOpen() {
    setIsOpen(true);
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Image
              src="/images/logo.png"
              width={100}
              height={50}
              alt="AI Eat Easy Logo"
              className="object-contain"
            />
          </Link>
          
          <div className="flex items-center gap-4">
            {!user ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleOpen}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  variant="outline"
                >
                  Login
                </Button>
                <Link href="/signup">
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition-colors duration-200">
                    Signup
                  </Button>
                </Link>
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200">
                    <AvatarImage
                      className="rounded-full"
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 shadow-lg rounded-xl border border-gray-100">
                  <div className="flex flex-col space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-lg text-gray-900">{user.restaurantName}</h4>
                      <p className="text-sm text-gray-500">
                        {`${user.firstName} ${user.lastName}`}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2 pt-2 border-t">
                      <Link href="/dashboard" className="w-full">
                        <Button 
                          className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50" 
                          variant="ghost"
                        >
                          View Profile
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => signOut(auth)} 
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                        variant="ghost"
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
      <LogIn isOpen={isopen} setIsOpen={setIsOpen} />
    </nav>
  );
}

export default NavBar;
