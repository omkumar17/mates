"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import api from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import FullPageLoader from "@/components/FullPageLoader";
import Image from "next/image";
import { ArrowLeft, MessageCircle, MapPin, Calendar } from "lucide-react";

export default function MatchedUserProfilePage() {
    const { userId } = useParams();
    const searchParams = useSearchParams();
    const matchId = searchParams.get("matchId");
    const { user } = useAuth();
    const router = useRouter();

    const [matchedUser, setMatchedUser] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !matchId) return;

        const fetchUser = async () => {
            try {
                const res = await api.get(`/matches/${matchId}`);
                const users = res.data.users;
                const otherUser = users.find((u) => u._id === userId);
                setMatchedUser(otherUser);
            } catch (err) {
                console.error("Failed to load matched user", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId, matchId, user]);

    const handleImageNav = (direction) => {
        if (!matchedUser?.images) return;
        const len = matchedUser.images.length;

        if (direction === "next") {
            setCurrentImageIndex((prev) => (prev < len - 1 ? prev + 1 : prev));
        } else {
            setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <FullPageLoader />
            </ProtectedRoute>
        );
    }

    if (!matchedUser) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen sm:ml-64 flex items-center justify-center">
                    <p className="text-lg opacity-60">User not found.</p>
                </div>
            </ProtectedRoute>
        );
    }

    const images = matchedUser.images || [];
    const currentImg = images[currentImageIndex];

    return (
        <ProtectedRoute>
            <div className="min-h-svh sm:ml-64 pb-20 sm:pb-0 bg-background text-foreground">
                {/* Header */}
                <div className="sticky top-0 z-40 border-b bg-pink-700 text-white backdrop-blur-md px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-1 rounded-full hover:bg-white/20 transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold truncate">{matchedUser.name}</h1>
                    <div className="fixed top-4 right-4 z-50 md:hidden">
                        <div
                            className="flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-lg text-white"
                            style={{ filter: "grayscale(100%) brightness(1000%)" }}
                        >
                            <Image
                                src="/logo.png"
                                alt="metly Logo"
                                width={25}
                                height={25}
                                className="mx-auto"
                            />
                            <span>Metly</span>
                        </div>
                    </div>
                </div>
                <div className="flex  w-full flex-col lg:flex-row gap-6 p-4 lg:p-8 bg-background">

                    {/* LEFT - IMAGE */}
                    <div className="relative items-center justify-center flex-1 lg:max-w-[45%]">
                        <div className="relative w-full flex max-w-95 aspect-9/16 overflow-hidden rounded-3xl shadow-2xl shadow-foreground bg-black">

                            {currentImg && (
                                <Image
                                    src={currentImg.url || currentImg}
                                    alt={matchedUser.name}
                                    fill
                                    className="object-cover aspect-9/16 transition-all duration-300"
                                    priority
                                />
                            )}

                            {/* Progress */}
                            {images.length > 1 && (
                                <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
                                    {images.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 h-1 rounded-full transition
              ${i === currentImageIndex
                                                    ? "bg-white"
                                                    : "bg-white/30"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Click zones */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => handleImageNav("prev")}
                                        className="absolute left-0 top-0 h-full w-1/2"
                                    />

                                    <button
                                        onClick={() => handleImageNav("next")}
                                        className="absolute right-0 top-0 h-full w-1/2"
                                    />
                                </>
                            )}

                            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                                {currentImageIndex + 1} / {images.length}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT - DETAILS */}
                    <div className="flex flex-1 flex-col justify-center overflow-hidden">

                        <div className="space-y-6">

                            <div>
                                <h2 className="text-3xl font-bold flex items-center gap-2">
                                    {matchedUser.name}
                                    {matchedUser.age && (
                                        <span className="text-xl font-normal opacity-60">
                                            {matchedUser.age} yrs
                                        </span>
                                    )}
                                </h2>

                                {matchedUser.city && (
                                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                                        <MapPin size={16} />
                                        {matchedUser.city}
                                    </div>
                                )}
                            </div>

                            {matchedUser.bio && (
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider opacity-60">
                                        About
                                    </h3>

                                    <p className="leading-7 opacity-80">
                                        {matchedUser.bio}
                                    </p>
                                </div>
                            )}

                            {matchedUser.interests?.length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-60">
                                        Interests
                                    </h3>

                                    <div className="flex flex-wrap gap-2">
                                        {matchedUser.interests.map((interest, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full bg-pink-600 dark:bg-pink-900 px-4 py-2 text-sm font-medium text-white"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BUTTON */}
                        <div className="pt-8">
                            <button
                                onClick={() => router.push(`/chat/${matchId}`)}
                                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 py-4 text-lg font-semibold text-white transition cursor-pointer active:scale-95 flex items-center justify-center gap-3"
                            >
                                <MessageCircle size={22} />
                                Send Message
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

