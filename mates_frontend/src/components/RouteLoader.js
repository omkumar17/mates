"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import FullPageLoader from "./FullPageLoader";

export default function RouteLoader({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 300); // smooth delay

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {loading && <FullPageLoader />}
      {children}
    </>
  );
}
