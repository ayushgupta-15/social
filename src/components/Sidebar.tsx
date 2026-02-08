"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { LinkIcon, MapPinIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type SidebarUser = {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  image: string | null;
  location: string | null;
  website: string | null;
  _count: { followers: number; following: number };
};

function Sidebar() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<SidebarUser | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!session?.user) return;
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = (await res.json()) as { user: SidebarUser | null };
      setUser(data.user ?? null);
    };
    load();
  }, [session?.user]);

  if (status !== "authenticated") return <UnAuthenticatedSidebar />;
  if (!user) return null;

  return (
    <div className="sticky top-20">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Link
              href={`/profile/${user.username ?? user.id}`}
              className="flex flex-col items-center justify-center"
            >
              <Avatar className="w-20 h-20 border-2 ">
                <AvatarImage src={user.image || "/avatar.png"} />
              </Avatar>

              <div className="mt-4 space-y-1">
                <h3 className="font-semibold">{user.name ?? user.username ?? user.id}</h3>
                <p className="text-sm text-muted-foreground">{user.username ?? user.id}</p>
              </div>
            </Link>

            {user.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>}

            <div className="w-full">
              <Separator className="my-4" />
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{user._count.following}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <p className="font-medium">{user._count.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              </div>
              <Separator className="my-4" />
            </div>

            <div className="w-full space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {user.location || "No location"}
              </div>
              <div className="flex items-center text-muted-foreground">
                <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                {user.website ? (
                  <a href={`${user.website}`} className="hover:underline truncate" target="_blank">
                    {user.website}
                  </a>
                ) : (
                  "No website"
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Sidebar;

const UnAuthenticatedSidebar = () => (
  <div className="sticky top-20">
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold">Welcome Back!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground mb-4">
          Login to access your profile and connect with others.
        </p>
        <Button className="w-full" variant="outline" asChild>
          <Link href="/auth/sign-in">Login</Link>
        </Button>
        <Button className="w-full mt-2" variant="default" asChild>
          <Link href="/auth/sign-up">Sign Up</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);
