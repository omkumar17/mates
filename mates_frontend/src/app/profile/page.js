"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileForm from "@/components/ProfileForm";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/me");
        setInitialData(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (data) => {
    try {
      const res = await api.put("/user/me", data);

      setUser(res.data.user);

      router.push("/discover");
    } catch (err) {
      console.error("Profile update failed", err);
    }
  };

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ProfileForm initialData={initialData} onSubmit={handleSubmit} />
        )}
      </div>
    </ProtectedRoute>
  );
}