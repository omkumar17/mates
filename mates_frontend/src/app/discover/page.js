"use client";

import { useEffect, useState } from "react";
import api from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import FullPageLoader from "@/components/FullPageLoader";

const EXIT = 420;

export default function DiscoverPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [offsetX, setOffsetX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  // 🔥 NEW: image index per card
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 🔥 Intent tracking
  const [viewStartTime, setViewStartTime] = useState(Date.now());

  // =============================
  // Fetch Discover Feed
  // =============================
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

  // =============================
  // 🔥 Reset image index + preload
  // =============================
  useEffect(() => {
    setCurrentImageIndex(0);
    setViewStartTime(Date.now());

    if (currentUser?.images) {
      currentUser.images.forEach((imgObj) => {
        const src = typeof imgObj === "string" ? imgObj : imgObj?.url;
        if (src) {
          const img = new window.Image();
          img.decoding = "async";
          img.loading = "eager";
          img.src = src;
        }
      });
    }
  }, [index, currentUser]);

  // useEffect(() => {
  //   if (currentUser) {
  //     api.post("/user/impression", {
  //       shownUserId: currentUser._id,
  //     });
  //   }
  // }, [currentUser]);

  // =============================
  // Animation Controller
  // =============================
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

  // =============================
  // Like / Skip
  // =============================
  const handleLike = async () => {
    if (!currentUser) return;

    const viewTimeMs = Date.now() - viewStartTime;

    try {
      await api.post(`/likes/${currentUser._id}`, {
        viewTimeMs,
        interactionDepth: currentImageIndex + 1, // 🔥 improved
      });
    } catch (error) {
      console.error("Like failed", error);
    }

    goNext("right");
  };

  const handleSkip = async () => {
    await api.post(`/interactions/skip/${currentUser._id}`);
    goNext("left");
  };

  // =============================
  // Touch Handlers (Swipe)
  // =============================
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

  // =============================
  // 🔥 TAP HANDLER (IMAGE SWITCH)
  // =============================
  const handleTap = (e) => {
    if (!currentUser?.images) return;

    const cardWidth = e.currentTarget.clientWidth;
    const clickX = e.nativeEvent.offsetX;

    if (clickX > cardWidth / 2) {
      // next image
      setCurrentImageIndex((prev) =>
        prev < currentUser.images.length - 1 ? prev + 1 : prev
      );
    } else {
      // previous image
      setCurrentImageIndex((prev) =>
        prev > 0 ? prev - 1 : prev
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-full bg-background text-foreground overflow-hidden">

        {/* Mobile Logo */}
        <div className="fixed top-4 right-4 z-50 md:hidden">
          <div className="flex items-center justify-center gap-2 text-md font-bold px-3 py-1 rounded-lg text-foreground">
            <Image
              src="/logo.png"
              alt="metly Logo"
              width={35}
              height={35}
              className="mx-auto"
            />

            <span>Metly</span>
          </div>
        </div>

        {/* Card Area */}
        <div className="flex items-center justify-center min-h-full sm:pl-64 px-2 pt-4 pb-20">

          {loading ? (
            <FullPageLoader subtitle="Finding new conncetions" />
          ) : !currentUser ? (
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
                You're all caught up!
              </h2>

              <p className="mt-2 max-w-sm text-gray-500 dark:text-gray-400">
                You've seen everyone nearby for now.
                Check back later to discover new people.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-8 rounded-full bg-linear-to-r from-pink-500 to-rose-500 px-8 py-3 text-white font-semibold hover:scale-105 transition"
              >
                Refresh
              </button>

            </div>
          ) : (
            <div className="w-full flex items-center justify-center h-[calc(100dvh-80px)] sm:max-w-sm">

              {/* CARD */}
              <div
                key={currentUser._id}
                className="relative 
        mx-auto
        w-[min(95vw,420px)]
        aspect-9/16
        max-h-[calc(100dvh-90px)] shadow-2xl overflow-hidden transition-transform duration-300 rounded-xl bg-black"
                style={{
                  transform: `translateX(${offsetX}px) rotate(${offsetX / 18}deg) scale(${1 - Math.abs(offsetX) / 3000})`,
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleTap} // 🔥 tap support
              >

{/* 🔥 IMAGE */}
                <img
                  src={typeof currentUser.images[currentImageIndex] === "string" ? currentUser.images[currentImageIndex] : currentUser.images[currentImageIndex]?.url}
                  alt={currentUser.name}
                  loading="eager"
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
                />

                {/* 🔥 TOP PROGRESS BAR */}
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                  {currentUser.images.map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-0.75 rounded-full ${i === currentImageIndex
                        ? "bg-white"
                        : "bg-white/40 border border-dashed border-white"
                        }`}
                    />
                  ))}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 w-full p-5 text-white z-10">
                  <h2 className="text-2xl font-semibold">
                    {currentUser.name}
                  </h2>

                  <p className="text-sm opacity-80 mb-4">
                    {[
                      currentUser.age && `${currentUser.age} yrs`,
                      currentUser.city,
                      currentUser.bio,
                      currentUser.interests?.slice(0, 3).join(", "),
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkip();
                      }}
                      disabled={isAnimating}
                      className="flex-1 rounded-full border-2 border-red-400 py-3 font-bold bg-red-500/30 backdrop-blur"
                    >
                      ❌ Skip
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike();
                      }}
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