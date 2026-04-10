"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Centralised auth check. Returns `true` once a token is confirmed present.
 * Redirects to /login when there is no token.
 */
export default function useAuth(): boolean {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsLoggedIn(true);
  }, [router]);

  return isLoggedIn;
}
