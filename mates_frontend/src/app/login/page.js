"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import ShowPasswordToggleBtn from "@/components/ShowPasswordToggleBtn";
import FullPageLoader from "@/components/FullPageLoader";

export default function LoginPage() {
  const router = useRouter();
  const { login, authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ------------------------
  // Submit
  // ------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { user, token } = res.data;
      login(user, token);

      router.push("/discover");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------
  // Block UI while auth loads
  // ------------------------
  if (authLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="loginHome relative min-h-screen p-4 flex items-center justify-center overflow-hidden">

      {/* Login Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[360px] rounded-2xl border border-white/20 
        bg-transparent backdrop-blur-xl p-8 shadow-2xl"
      >
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="text-3xl">❤️</div>
          <h1 className="mt-2 text-2xl font-bold">
            Welcome Back
          </h1>
          <p className="text-sm opacity-70">
            Login to continue to Mates
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="text-xs opacity-70">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-white/10 bg-transparent p-3 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="mb-2">
          <label className="text-xs opacity-70">Password</label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-white/10 bg-transparent p-3 pr-14 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ShowPasswordToggleBtn
                show={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
              />
            </div>
          </div>
        </div>

        {/* Forgot */}
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-sm text-red-500 hover:text-blue-500 transition"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          disabled={submitting}
          className="w-full rounded-lg py-3 font-semibold text-white
          bg-gradient-to-r from-blue-500 to-indigo-500
          disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>

        <p className="mt-5 text-center text-xs opacity-60">
          Secure login • Encrypted data
        </p>
      </form>
    </div>
  );
}
