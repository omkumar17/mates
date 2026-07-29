"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");

    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className=" sm:bg-foreground sm:text-background sm:p-2  flex flex-col rounded-full sm:text-md "
    >
      <span className="">{theme === "dark" ? "🌞" : "🌙"}</span>
      <span>{theme === "dark" ? "Light" : "dark"}</span>
    </button>
  );
}
