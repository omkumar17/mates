"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
      className="sm:bg-foreground sm:text-background sm:p-2 flex flex-col rounded-full sm:text-md"
    >
      <div className="flex sm:flex-row flex-col gap-1 items-center justify-center">
        <div className="flex items-center justify-center rounded-full transition">
          {resolvedTheme === "dark" ? (
            <Sun size={30} className="text-yellow-400" />
          ) : (
            <Moon size={30} className="text-slate-700" />
          )}
        </div>

        <span className="text-sm">
          {resolvedTheme === "dark" ? "Light" : "Dark"}
        </span>
      </div>
    </button>
  );
}