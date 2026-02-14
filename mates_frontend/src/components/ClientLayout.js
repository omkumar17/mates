"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import FullPageLoader from "@/components/FullPageLoader";

export default function ClientLayout({ children }) {
  const { authLoading } = useAuth();

  return (
    <>
      {/* Only block app during auth bootstrap */}
      {authLoading && <FullPageLoader />}

      {/* Navbar always mounted */}
      <Navbar />

      {/* Pages render normally */}
      {children}
    </>
  );
}
