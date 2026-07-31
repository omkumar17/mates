"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import ShowPasswordToggleBtn from "@/components/ShowPasswordToggleBtn";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { logout } = useAuth();

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

      toast.success(
        "Registration successful!"
      );

      router.push("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginHome text-white relative h-full p-4 flex items-center justify-center overflow-scroll">

      {/* Background handled by .loginHome CSS */}

      {/* Register Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-90 rounded-2xl border text-white border-white/20 
        bg-transparent backdrop-blur-xl p-8 shadow-2xl"

      >
        {/* Title */}
        <div className="mb-6 text-center">
          <div className="text-3xl">
            <Image
              src="/logo.png"
              alt="metly Logo"
              width={50}
              height={50}
              className="mx-auto mb-6"
            />
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Create Account
          </h1>
          <p className="text-sm opacity-70">
            Join Metly and start connecting
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
            className="mt-1 w-full text-white rounded-lg border border-white/10 bg-transparent p-3 
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
            className="mt-1 w-full text-white rounded-lg border border-white/10 bg-transparent p-3 
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
              className="mt-1 text-white w-full rounded-lg border border-white/10 bg-transparent p-3 pr-14
              outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
              value={form.password}
              // value="secret123"
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
          bg-linear-to-r from-pink-800 to-pink-800
          transition-all duration-300
          hover:scale-[1.02] hover:shadow-lg
          active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        {/* Login Link */}
        <p className="mt-4 text-center text-sm opacity-70">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-blue-500 hover:text-blue-400 transition"
          >
            Login
          </button>
        </p>

        {/* Footer */}
        <p className="mt-5 text-center text-xs opacity-60">
          By signing up, you agree to our Terms & Privacy Policy
        </p>
      </form>
    </div>
  );
}
