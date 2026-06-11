"use client";

import { useAuth } from "../lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import LoadingNarrative from "./LoadingNarrative";

export default function RouteGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && pathname === "/login") {
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <LoadingNarrative />
      </div>
    );
  }

  // Prevent flashing protected content before redirect
  if (!user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
