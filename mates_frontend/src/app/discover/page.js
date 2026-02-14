"use client";

import { useEffect, useState } from "react";
import api from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const EXIT = 420;

export default function DiscoverPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [offsetX, setOffsetX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        const res = await api.get("/user/discover");
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const currentUser = users[index];

  // --------------------
  // Animation Controller
  // --------------------
  const goNext = (direction) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const exitX = direction === "right" ? EXIT : -EXIT;
    setOffsetX(exitX);

    setTimeout(() => {
      const nextIndex = index + 1;

      if (!users[nextIndex]) {
        setIndex(nextIndex);
        setIsAnimating(false);
        return;
      }

      setOffsetX(0);
      setIndex(nextIndex);
      setIsAnimating(false);
    }, 280);
  };

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      await api.post(`/likes/${currentUser._id}`);
    } catch (error) {
      console.error("Like failed", error);
    }

    goNext("right");
  };

  const handleSkip = () => {
    goNext("left");
  };

  // --------------------
  // Touch handlers
  // --------------------
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null || isAnimating) return;

    const delta = e.touches[0].clientX - touchStartX;

    if (Math.abs(delta) > 10) {
      e.preventDefault();
    }

    setOffsetX(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || isAnimating) return;

    if (offsetX > 120) handleLike();
    else if (offsetX < -120) handleSkip();
    else setOffsetX(0);

    setTouchStartX(null);
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden">

        {/* ================= Mobile Top Left Logo ================= */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <div className="flex items-center gap-2 text-lg font-bold tracking-wide drop-shadow-lg
            bg-black/30 backdrop-blur px-3 py-1 rounded-lg">
            ❤️ <span>Mates</span>
          </div>
        </div>

        {/* ================= Card Area ================= */}
        <div
          className="
            flex items-center justify-center
            min-h-full
            sm:pl-64
            px-2
            pt-4 sm:pt-0
            pb-20 sm:pb-0
            overflow-hidden
          "
        >
          {loading ? (
            <div>Loading...</div>
          ) : !currentUser ? (
            <p className="opacity-80 absolute top-[50%] text-center">🎉 No more users to discover</p>
          ) : (
            <div
              className="
                w-full
                h-[calc(100dvh-80px)]   /* full height minus bottom navbar */
                sm:max-w-sm
                sm:px-0
                overflow-hidden
              "
            >
              {/* ================= CARD ================= */}
              <div
                key={currentUser._id}
                className="
                  relative h-full
                  shadow-2xl overflow-hidden
                  transition-transform duration-300 touch-pan-y
                  rounded-xl md:rounded-2xl
                  bg-black
                "
                style={{
                  transform: `translateX(${offsetX}px) rotate(${offsetX / 18}deg) scale(${1 - Math.abs(offsetX) / 3000})`,
                  touchAction: "pan-y",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Image */}
                <img
                  src="/omkumar_image.jpg"
                  alt={currentUser.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                {/* Dark Fade Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 w-full p-5 text-white z-10">
                  <h2 className="text-2xl font-semibold">
                    {currentUser.name}
                  </h2>

                  <p className="text-sm opacity-80 mb-4">
                    {currentUser.email}
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSkip}
                      disabled={isAnimating}
                      className="flex-1 rounded-full border-2 border-red-400 py-3 font-bold bg-red-500/30 backdrop-blur"
                    >
                      ❌ Skip
                    </button>

                    <button
                      onClick={handleLike}
                      disabled={isAnimating}
                      className="flex-1 rounded-full border-2 border-green-400 py-3 font-bold bg-green-500/30 backdrop-blur"
                    >
                      ❤️ Like
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
