"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import ShowPasswordToggleBtn from "@/components/ShowPasswordToggleBtn";


export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", form);
      const { user, token } = res.data;

      login(user, token);
      router.push("/discover");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginHome relative min-h-screen p-4 flex items-center justify-center overflow-hidden">

      {/* Background handled by .loginHome CSS */}

      {/* Register Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[360px] rounded-2xl border border-white/20 
        bg-transparent backdrop-blur-xl p-8 shadow-2xl"
        style={{ color: "var(--foreground)" }}
      >
        {/* Title */}
        <div className="mb-6 text-center">
          <div className="text-3xl">✨</div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Create Account
          </h1>
          <p className="text-sm opacity-70">
            Join Mates and start connecting
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs opacity-70">Full Name</label>
          <input
            name="name"
            placeholder="John Doe"
            className="mt-1 w-full rounded-lg border border-white/10 bg-transparent p-3 
            outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-xs opacity-70">Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-white/10 bg-transparent p-3 
            outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-xs opacity-70">Password</label>

          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="mt-1 w-full rounded-lg border border-white/10 bg-transparent p-3 pr-14
              outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
              value={form.password}
              onChange={handleChange}
              required
            />

            {/* Show / Hide */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ShowPasswordToggleBtn
                show={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          disabled={loading}
          className="w-full rounded-lg py-3 font-semibold text-white
          bg-gradient-to-r from-blue-500 to-indigo-500
          transition-all duration-300
          hover:scale-[1.02] hover:shadow-lg
          active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {/* Footer */}
        <p className="mt-5 text-center text-xs opacity-60">
          By signing up, you agree to our Terms & Privacy Policy
        </p>
      </form>
    </div>
  );
}
