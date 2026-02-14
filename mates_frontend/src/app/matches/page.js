"use client";

import { useEffect, useState } from "react";
import api from "@/api/apiClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/components/FullPageLoader";

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
          bg-[var(--background)] text-[var(--foreground)]
        "
      >
        <h1 className="text-2xl font-bold text-center mb-6">
          Your Matches
        </h1>

        {matches.length === 0 ? (
          <p className="text-center opacity-80">
            No matches yet
          </p>
        ) : (
          <div className="max-w-md mx-auto space-y-4">
            {matches.map((match) => (
              <div
                key={match.matchId}
                className="
                  p-5 rounded-xl border shadow-sm cursor-pointer 
                  transition hover:shadow-md hover:scale-[1.01]
                  bg-[var(--card)]
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
