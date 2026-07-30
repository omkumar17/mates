"use client";

import { useEffect, useState } from "react";
import api from "@/api/apiClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/components/FullPageLoader";
import Image from "next/image";
import { Heart } from "lucide-react";

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
    min-h-svh
    sm:pl-64
    pb-16
    sm:pb-0
    bg-background
    text-foreground
  "
      >
        <div className="sticky text-sm top-0 z-40 border-b bg-pink-700 text-white backdrop-blur-md px-5 py-3">
          <div className="flex flex-col text-sm">
            <div className="flex gap-2 items-center">
            <Heart
              size={35}
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold">
                Matches
              </h1>

              <p className="text-sm text-white">
                {matches.length} {matches.length === 1 ? "match" : "matches"}
              </p>
            </div>
            </div>
            <div className="fixed top-4 right-4 z-50 md:hidden">
              <div className="flex items-center gap-2 font-bold px-3 py-1 rounded-lg text-white " style={{
                filter: "grayscale(100%) brightness(1000%)",
              }}>
                <Image
                  src="/logo.png"
                  alt="metly Logo"
                  width={30}
                  height={30}
                  className="mx-auto "
                />

                <span>Metly</span>
              </div>
            </div>
          </div>


        </div>

        {matches.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">

            <div className="h-24 w-24 rounded-full bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center animate-pulse">

              <span className="text-5xl">
                <Image
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
              onClick={() => router.push("/discover")}
              className="mt-8 rounded-full bg-linear-to-r from-pink-500 to-rose-500 px-8 py-3 text-white font-semibold hover:scale-105 transition"
            >
              Discover People
            </button>

          </div>
        ) : (
          <div className="relative mx-auto max-w-5xl space-y-3 p-4">
            {matches.map((match) => (
              <div
                key={match.matchId}
                onClick={() => router.push(`/chat/${match.matchId}`)}
                className="
        flex
        items-center
        gap-4
        rounded-2xl
        shadow
        dark:shadow-gray-500
        bg-card
        p-4
        cursor-pointer
        transition
        hover:shadow-lg
        hover:-translate-y-0.5
    "
              ><div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={match.user.images?.[0]?.url || "/default-avatar.png"}
                    alt={match.user.name || "Profile"}
                    fill
                    className="object-cover object-top"
                  />
                </div>

                <div className="flex-1 min-w-0">

                  <h2 className="font-semibold truncate">
                    {match.user.name}
                  </h2>

                  {/* <p className="text-sm opacity-60 truncate">
                    {match.user.email}
                  </p> */}

                </div>

                <div className="text-xl opacity-40">
                  →
                </div>
              </div>
            ))}
          </div>


        )}
      </div>
    </ProtectedRoute>
  );
}
