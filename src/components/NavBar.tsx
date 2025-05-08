"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import Link from "next/link";
import LogIn from "./LogIn";

function NavBar() {
  const [isopen, setIsOpen] = useState<boolean>(false);
  function handledia() {
    setIsOpen(true);
  }

  const user = true;

  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <Link href="/">
        <h4 className="font-bold text-red-700 text-2xl">Ai eat easy</h4>
          {/* <Image
            src="/images/Ai-Eat-Easy logo.png"
            alt="Ai-Eat-Easy logo"
            width={80}
            height={50}
          /> */}
        </Link>
        <div className="flex gap-4">
          <Button
            onClick={handledia}
            className="bg-blue-700 text-white"
            variant="outline"
          >
            Login
          </Button>
          <Link href="/signup">
            <Button>Signup</Button>
          </Link>
          {user && <Popover >
                        <PopoverTrigger asChild>
                          <Avatar>
                            <AvatarImage
                              className=" rounded-full cursor-pointer"
                              src="https://github.com/shadcn.png"
                              alt="@shadcn"
                            />
                          </Avatar>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="flex">
                            <Avatar>
                              <AvatarImage
                                className="h-6 rounded-full cursor-pointer"
                                src="https://github.com/shadcn.png"
                                alt="@shadcn"
                              />
                            </Avatar>
                            <div>
                              <h4 className="font-bold ">User</h4>
                              <p className="text-sm  text-muted-foreground">
                                Lorem ipsum dolor sit, amet.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col my-2 text-gray-600">
                            <div className="flex w-fit items-center gap-2 cursor-pointer">
                            
                             
                                <Button className="border-none" variant="link">
                                  View Profile
                                </Button>
                             
                            </div>
                            <div className="flex w-fit items-center gap-2 cursor-pointer">
                              
                              <Button variant="link">Logout</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
}
        </div>
      </div>
      <LogIn isOpen={isopen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default NavBar;
