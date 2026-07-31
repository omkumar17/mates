"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Compass,
  Heart,
  User,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!window.visualViewport) return;

    const viewport = window.visualViewport;

    const updateKeyboard = () => {
      const keyboardHeight =
        window.innerHeight -
        viewport.height -
        viewport.offsetTop;

      setKeyboardVisible(keyboardHeight > 100);
    };

    updateKeyboard();

    viewport.addEventListener("resize", updateKeyboard);
    viewport.addEventListener("scroll", updateKeyboard);

    return () => {
      viewport.removeEventListener("resize", updateKeyboard);
      viewport.removeEventListener("scroll", updateKeyboard);
    };
  }, []);

  if (!user) return null;

  const isActive = (path) => pathname.startsWith(path);

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
    <>
      {/* ================= Desktop Sidebar ================= */}
      <aside className="hidden sm:flex fixed left-0 top-0 h-screen w-64 flex-col text-white border-r bg-pink-900 backdrop-blur-xl z-101">

        {/* Logo */}
        <div className="p-6 text-2xl font-bold flex flex-col items-center gap-2">
          <Image
            src="/logo.png"
            alt="Metly Logo"
            width={50}
            height={50}
            className="mx-auto"
          />
          <span>Metly</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 ">
          <SideItem href="/discover" active={isActive("/discover")}>
            <div className="flex items-center gap-4">
              <Compass
                size={35}
                
              />

              <span className="font-medium">
                Discover
              </span>
            </div>
          </SideItem>

          <SideItem href="/matches" active={isActive("/matches")}>
            <div className="flex items-center gap-4">
              <Heart
                size={35}
                
              />

              <span className="font-medium">
                Matches
              </span>
            </div>
          </SideItem>

          <SideItem href="/profile" active={isActive("/profile")}>
            <div className="flex items-center gap-4">
              <div
                className={`relative h-9 w-9 rounded-full overflow-hidden border-2 
                  }`}
              >
                <Image
                  src={user.images?.[0]?.url || "/default-avatar.png"}
                  alt={user.name}
                  fill
                  className="object-cover object-top"
                />
              </div>

              <span className="font-medium">
                {user.name || "Profile"}
              </span>
            </div>
          </SideItem>
        </nav>

        {/* Footer */}
        <div className="border-t p-4 space-y-3">

          <ThemeToggle />

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 py-3 text-white transition"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>
      </aside>

      {/* ================= Mobile Bottom Bar ================= */}
      <nav
        className={`
          sm:hidden
          fixed
          bottom-0
          inset-x-0
          z-101
          bg-(--background)/90
          backdrop-blur-xl
          border-t
          transition-transform
          duration-300
          ${keyboardVisible ? "translate-y-full" : "translate-y-0"}
        `}
      >
        <div className="flex justify-around py-2">

          <BottomItem href="/discover" active={isActive("/discover")}>
            <div className="flex flex-col items-center gap-1">
              <Compass
                size={30}
                className={isActive("/discover")
                  ? "text-pink-500"
                  : "text-foreground"}
              />
              <span
                className={`text-xs ${isActive("/discover")
                  ? "text-pink-500 font-medium"
                  : "text-foreground"
                  }`}
              >
                Discover
              </span>
            </div>
          </BottomItem>

          <BottomItem href="/matches" active={isActive("/matches")}>
            <div className="flex flex-col items-center gap-1 relative">
              <Heart
                size={30}
                className={isActive("/matches")
                  ? "text-pink-500 fill-pink-500"
                  : "text-foreground"}
              />



              <span
                className={`text-xs ${isActive("/matches")
                  ? "text-pink-500 font-medium"
                  : "text-foreground"
                  }`}
              >
                Matches
              </span>
            </div>
          </BottomItem>

          <BottomItem href="/profile" active={isActive("/profile")}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`relative h-8 w-8 rounded-full overflow-hidden border ${isActive("/profile")
                  ? "border-pink-500"
                  : "border-transparent dark:border-white"
                  }`}
              >
                <Image
                  src={user.images?.[0]?.url || "/default-avatar.png"}
                  alt="Profile"
                  fill
                  className="object-cover object-top "
                />
              </div>

              <span
                className={`text-xs ${isActive("/profile")
                  ? "text-pink-500 font-medium"
                  : "text-foreground"
                  }`}
              >
                {user.name.split(" ")[0]}
              </span>
            </div>
          </BottomItem>

          <ThemeToggle />

        </div>
      </nav>
    </>
  );
}

/* ---------------- Components ---------------- */

function SideItem({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`block rounded-xl px-4 py-3 font-medium transition ${active
        ? "bg-linear-to-r bg-white text-black shadow"
        : "hover:bg-black/5 dark:hover:bg-white/10"
        }`}
    >
      {children}
    </Link>
  );
}

function BottomItem({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 ${active ? "text-pink-500 font-semibold" : "opacity-70"
        }`}
    >
      {children}
    </Link>
  );
}

/* ---------------- Avatar ---------------- */

function Avatar({ name, image, size = "md" }) {
  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-10 w-10 text-sm",
  };

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`rounded-full object-cover ${sizes[size]}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-linear-to-br from-pink-500 to-purple-500
      flex items-center justify-center text-white font-bold ${sizes[size]}`}
    >
      {name?.[0]?.toUpperCase()}
    </div>
  );
}