"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = ["/", "/login", "/register"];
const PROFILE_PATHS = ["/profile"];

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/");
      return;
    }

    // Redirect to profile if profile is not completed
    if (!user.profileCompleted && !PROFILE_PATHS.includes(pathname)) {
      router.push("/profile");
    }
  }, [user, authLoading, router, pathname]);

  if (authLoading) return null;

  if (!user) return null;

  // Don't block /profile page if profile is incomplete
  if (!user.profileCompleted && !PROFILE_PATHS.includes(pathname)) {
    return null;
  }

  return children;
}
