"use client";

import { useEffect, useState } from "react";
import api from "@/api/apiClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/components/FullPageLoader";
import Image from "next/image";

export default function MatchesPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // ------------------------
  // Fetch Matches
  // ------------------------
  useEffect(() => {
    if (!user) return;

    const fetchMatches = async () => {
      try {
        const res = await api.get("/matches");
        setMatches(res.data);
      } catch (error) {
        console.error("Failed to fetch matches", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchMatches();
  }, [user]);

  // ------------------------
  // Global Loading
  // ------------------------
  if (authLoading || pageLoading) {
    return <FullPageLoader />;
  }

  return (
    <ProtectedRoute>
      <div
        className="
          min-h-screen p-4 sm:p-6
          sm:pl-64   /* desktop sidebar spacing */
          bg-background text-foreground
        "
      >
        <h1 className="text-2xl font-bold text-center mb-6">
          Your Matches
        </h1>

        {matches.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">

            <div className="h-24 w-24 rounded-full bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center animate-pulse">

              <span className="text-5xl"><Image
                src="/logo.png"
                alt="metly Logo"
                width={50}
                height={50}
                className="mx-auto mb-6"
              /></span>

            </div>

            <h2 className="mt-6 text-2xl font-bold">
              Oops, No matches currently!
            </h2>

            <p className="mt-2 max-w-sm text-gray-500 dark:text-gray-400">
              Explore and connect with new people to find your perfect match.
            </p>

            <button
              onClick={() => window.redirect("/discover")}
              className="mt-8 rounded-full bg-linear-to-r from-pink-500 to-rose-500 px-8 py-3 text-white font-semibold hover:scale-105 transition"
            >
              Discover People
            </button>

          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-4">
            {matches.map((match) => (
              <div
                key={match.matchId}
                className="
                  p-5 rounded-xl border shadow-sm cursor-pointer 
                  transition hover:shadow-md hover:scale-[1.01]
                  bg-card
                "
                onClick={() =>
                  router.push(`/chat/${match.matchId}`)
                }
              >
                <h2 className="font-semibold">
                  {match.user.name}
                </h2>
                <p className="text-sm opacity-80">
                  {match.user.email}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
