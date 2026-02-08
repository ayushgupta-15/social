"use client";

import { BellIcon, HomeIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ModeToggle from "./ModeToggle";
import { signIn, signOut, useSession } from "next-auth/react";

function DesktopNavbar() {
  const { data: session } = useSession();

  return (
    <div className="hidden md:flex items-center space-x-4">
      <ModeToggle />

      <Button variant="ghost" className="flex items-center gap-2" asChild>
        <Link href="/">
          <HomeIcon className="w-4 h-4" />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>

      {session?.user ? (
        <>
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link href="/notifications">
              <BellIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Notifications</span>
            </Link>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link href={`/profile/${session.user.username ?? session.user.id}`}>
              <UserIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Profile</span>
            </Link>
          </Button>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </>
      ) : (
        <Button variant="default" onClick={() => signIn()}>
          Sign In
        </Button>
      )}
    </div>
  );
}
export default DesktopNavbar;
