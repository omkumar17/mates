"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // if (!user) return null;

  const isActive = (path) => pathname.startsWith(path);

  return (
    <nav className="fixed top-0 z-50 w-full  ">
      <div className=" flex  flex-wrap items-center justify-between md:p-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 p-4">
          <span className="text-xl font-semibold border-0">
            ❤️ Mates
          </span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-3 md:order-2 p-4">

          {/* Profile Button
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full border text-sm focus:ring-2"
          >
            <span className="font-semibold">
              {user.name?.[0]?.toUpperCase()}
            </span>
          </button> */}

          {/* Profile Dropdown */}
          {/* {profileOpen && (
            <div className="absolute right-4 top-14 z-50 w-44 rounded-lg border bg-(--background) shadow">
              <div className="border-b px-4 py-3 text-sm">
                <div className="font-medium">{user.name}</div>
                <div className="truncate text-xs opacity-70">
                  {user.email}
                </div>
              </div>

              <div className="p-2 text-sm">
                
                <button
                  onClick={logout}
                  className="mt-2 w-full rounded px-2 py-2 text-left text-red-500 hover:opacity-80"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
          <ThemeToggle /> */}


          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm hover:opacity-80 focus:outline-none md:hidden "
          >
            ☰
          </button>
        </div>

        {/* Navigation Links */}
        <div
          className={`w-screen items-center justify-between md:order-1 md:flex md:w-auto 
            `}
        >
          <ul className={`fixed top-0 flex w-full flex-col  md:static font-medium md:mt-0 
          md:flex-row md:space-x-8 md:border-0 md:p-0 bg-[color-mix(in_srgb,var(--background)_85%,white)]


          md:bg-transparent h-screen md:h-auto 
          md:transition-none transition-transform duration-500 ease-in-out
      will-change-transform gap-4
      
      ${menuOpen
              ? "md:translate-none translate-x-0"
              : "md:translate-none translate-x-full"}  `}>

            <li className="md:hidden">
              <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-xl font-semibold border-0">
                    ❤️ Mates
                  </span>
                </Link>

                <div className="flex items-center gap-3 md:order-2"></div>
                {/* Hamburger */}
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm hover:opacity-80 focus:outline-none md:hidden"
                >
                  X
                </button>
              </div>
            </li>

            <li>
              <Link
                href="/discover"
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-10 py-2 md:bg-transparent bg-background ${isActive("/discover")
                  ? "underline font-semibold"
                  : "hover:opacity-80"
                  }`}
              >
                Discover
              </Link>
            </li>

            <li>
              <Link
                href="/matches"
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-10 py-2 md:bg-transparent bg-background ${isActive("/matches")
                  ? "underline font-semibold"
                  : "hover:opacity-80"
                  }`}
              >
                Matches
              </Link>
            </li>
            <li>
              <Link
                href="/discover"
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-10 py-2 md:bg-transparent bg-background ${isActive("/discover")
                  ? "underline font-semibold"
                  : "hover:opacity-80"
                  }`}
              >
                Discover
              </Link>
            </li>

            <li>
              <Link
                href="/matches"
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-10 py-2 md:bg-transparent bg-background ${isActive("/matches")
                  ? "underline font-semibold"
                  : "hover:opacity-80"
                  }`}
              >
                Matches
              </Link>
            </li>
            <li>
              <Link
                href="/discover"
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-10 py-2 md:bg-transparent bg-background ${isActive("/discover")
                  ? "underline font-semibold"
                  : "hover:opacity-80"
                  }`}
              >
                Discover
              </Link>
            </li>

            <li>
              <Link
                href="/matches"
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-10 py-2 md:bg-transparent bg-background ${isActive("/matches")
                  ? "underline font-semibold"
                  : "hover:opacity-80"
                  }`}
              >
                Matches
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
