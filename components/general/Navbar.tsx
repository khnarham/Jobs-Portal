import React from 'react'
import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/logo.png";
import { ThemeToggle } from "./ThemeToggle";
import { auth } from "@/app/utlis/auth";
import { buttonVariants, Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserDropdown } from './UserDropdown';
const Navbar = async () => {
    const session = await auth()

  return (
    <nav className="flex justify-between items-center py-5">
          <Link href="/" className="flex items-center gap-2">
        <Image src={Logo} alt="Job Marshal Logo" width={40} height={40} />
        <h1 className="text-2xl font-bold">
          Job<span className="text-[#33b97c]">Marshal</span>
        </h1>
      </Link>
      <div className="hidden md:flex items-center gap-5">
        <ThemeToggle />
           <Link href="/post-job" className={buttonVariants({variant: "outline"})}>
           <Plus className="w-4 h-4" />
            Post a Job
           </Link>
           {session?.user ? (
            <UserDropdown
            email={session.user.email!}
            name={session.user.name!}
            image={session.user.image!}
          />
        ) : (
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Login
          </Link>
        )}
      </div>
      <div className="md:hidden flex items-center gap-4">
        <ThemeToggle />
        {session?.user ? (
              <UserDropdown
              email={session.user.email!}
              name={session.user.name!}
              image={session.user.image!}
            />
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader className="text-left">
                <SheetTitle>
                  Job<span className="text-primary">Marshal</span>
                </SheetTitle>
                <SheetDescription>
                  Find or post your next job opportunity
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 mt-6">
                <Link
                  href="/"
                  className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                >
                  Find New Job
                </Link>
                <Link
                  href="/post-job"
                  className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                >
                  Post a Job
                </Link>
                <Link
                  href="/login"
                  className="text-lg px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                >
                  Login
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  )
}

export default Navbar   