"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import api from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileForm from "@/components/ProfileForm";
import FullPageLoader from "@/components/FullPageLoader";
import Swal from "sweetalert2";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/me");
        setInitialData(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (data) => {
    try {
      setSaving(true);

      const res = await api.put("/user/me", data);

      setUser(res.data.user);

      toast.success("Profile updated successfully!");

      setTimeout(() => {
        router.push("/discover");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      html: "<p>You will need to login again to continue.</p>",
      icon: "warning",
      background: "#ffffff",
      color: "#111827",
       showCancelButton: true,
      confirmButtonColor: "#ec4899",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Stay",
    });

    if (result.isConfirmed) {
      logout();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br pt-5">
        <div className="md:hidden flex justify-between px-4">
          <div className="relative top-4 right-4 z-50 md:hidden">
            <div className="flex items-center gap-2 text-lg font-bold px-3 py-1 rounded-lg text-foreground">
              <Image
                src="/logo.png"
                alt="metly Logo"
                width={50}
                height={50}
                className="mx-auto mb-6"
              />

              <span>Metly</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl font-bold bg-foreground text-red-500"
          >
            🚪
            <span className="text-sm">Logout</span>
          </button>
        </div>

        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">

          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-rose-300/20 blur-3xl" />

        </div>

        <div className="relative flex min-h-screen items-center justify-center px-4 py-10">

          {loading ? (
            <FullPageLoader />
          ) : (
            <div className="w-full max-w-md">

              {/* Heading */}

              <div className="text-center mb-8">

                <h1 className="text-4xl font-bold">
                  Complete Your Profile
                </h1>

                <p className="text-gray-500 mt-2">
                  Help others know you better.
                </p>

              </div>

              {/* Progress */}

              {/* <div className="mb-6">

                <div className="flex justify-between text-sm mb-2">
                  <span>Profile Completion</span>
                  <span>80%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">

                  <div className="h-full w-4/5 rounded-full bg-linear-to-r from-pink-500 to-rose-500 transition-all duration-700" />

                </div>

              </div> */}

              {/* Form */}

              <ProfileForm
                initialData={initialData}
                onSubmit={handleSubmit}
                saving={saving}
              />

            </div>
          )}

        </div>

        {/* Full Screen Saving Overlay */}

        {saving && (
          <div className="fixed inset-0 flex items-center justify-center z-50">

            <div className="rounded-2xl  p-8 flex flex-col items-center gap-4 shadow-xl">

              <div className="h-12 w-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />

              <h3 className="font-semibold text-lg">
                Saving Profile...
              </h3>

              <p className="text-sm text-gray-500 text-center">
                Please wait while we update your profile.
              </p>

            </div>

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}