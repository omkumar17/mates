"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  const isActive = (path) => pathname.startsWith(path);

  return (
    <>
      {/* ================= Desktop Sidebar ================= */}
      <aside className="hidden sm:flex fixed left-0 top-0 h-screen w-64 flex-col border-r bg-[var(--background)]/90 backdrop-blur-xl z-50">

        {/* Logo */}
        <div className="p-6 text-2xl font-bold flex items-center gap-2">
          ❤️ Mates
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          <SideItem href="/discover" active={isActive("/discover")}>
            🔥 Discover
          </SideItem>

          <SideItem href="/matches" active={isActive("/matches")}>
            💬 Matches
          </SideItem>

          <SideItem href="/profile" active={isActive("/profile")}>
            👤 Profile
          </SideItem>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          <ThemeToggle />

          {/* Profile Preview */}
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl p-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <Avatar name={user.name} image={user.image} />
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs opacity-60">View profile</p>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full rounded-lg py-2 text-red-500 hover:bg-red-500/10 transition text-sm font-medium"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ================= Mobile Bottom Bar ================= */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--background)]/90 backdrop-blur-xl border-t">
        <div className="flex justify-around py-2">

          <BottomItem href="/discover" active={isActive("/discover")}>
            🔥
            <span className="text-xs">Discover</span>
          </BottomItem>

          <BottomItem href="/matches" active={isActive("/matches")}>
            💬
            <span className="text-xs">Matches</span>
          </BottomItem>

          <BottomItem href="/profile" active={isActive("/profile")}>
            <Avatar name={user.name} image={user.image} size="sm" />
            <span className="text-xs">{user.name}</span>
          </BottomItem>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 text-red-500"
          >
            🚪
            <span className="text-xs">Logout</span>
          </button>
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
      className={`block rounded-xl px-4 py-3 font-medium transition ${
        active
          ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow"
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
      className={`flex flex-col items-center gap-1 ${
        active ? "text-pink-500 font-semibold" : "opacity-70"
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
      className={`rounded-full bg-gradient-to-br from-pink-500 to-purple-500 
      flex items-center justify-center text-white font-bold ${sizes[size]}`}
    >
      {name?.[0]?.toUpperCase()}
    </div>
  );
}
