"use client";

import {useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import Header from "@/components/Header";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(null);


//   useEffect(() => {
//   const checkDevice = () => {
//     setIsMobile(window.innerWidth < 768); // Tailwind md breakpoint
//   };

//   checkDevice(); // initial
//   window.addEventListener("resize", checkDevice);

//   return () => window.removeEventListener("resize", checkDevice);
// }, []);




  // 👉 Auto redirect logged-in users (optional)
  useEffect(() => {
    if (user) {
      router.push("/discover");
    }
  }, [user, router]);

  return (
    <>
    <Header/>
    <div
      className="home min-h-full relative flex flex-col items-center justify-center px-6 text-center bg-black/40 backdrop-blur-xs"
//       style={{
//   backgroundImage: isMobile
//     ? "url('/wallpaper2.jpg')"
//     : "url('/wallpaper.png')",
//   backgroundSize: "cover",
//   backgroundPosition: "center",
// }}

    >
      {/* Overlay */}
      {/* <div className="absolute inset-0 bg-black/40 backdrop-blur-xs"></div> */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/85"></div> */}


      {/* Theme Toggle */}
      {/* {!user && (
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      )} */}

      {/* Content */}
        
      <div className="relative flex flex-col item-center justify-center py-20 w-full min-h-[500px] text-white ">

        {/* <div className="mb-6 text-7xl font-bold">
          ❤️ Mates
        </div> */}

        <h1 className="text-3xl  sm:text-6xl font-bold mb-5">
          Discover. Match. Connect.
        </h1>

        {/* <p className="max-w-3xl mx-auto text-base sm:text-lg opacity-90 mb-8">
          Find meaningful connections with people who share your interests.
          Swipe, match, and chat in real time — all in one place.
        </p> */}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          {!user && (
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 rounded-lg font-extrabold bg-white text-black hover:opacity-90   transition"
            >
              Get Started
            </button>
          )}

          {user && (
            <button
              onClick={() => router.push("/discover")}
              className="px-6 py-3 rounded-lg font-extrabold bg-white text-black hover:opacity-90 transition"
            >
              Let’s Connect
            </button>
          )}

         
            <button
              onClick={() => router.push("/register")}
              className="px-6 py-3 rounded-lg font-semibold border border-white/40 text-white hover:bg-white/10 transition"
            >
              Create Account
            </button>
          
        </div>

        <p className="mt-10 text-sm opacity-70">
          Built with ❤️ using MERN + Next.js
        </p>
      </div>
    </div>
    </>
  );
}