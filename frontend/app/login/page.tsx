"use client";

import { useEffect, useState } from "react";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      window.location.href = "/";
    } else {
      setReady(true);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = "/";
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <LoginForm onLogin={handleLogin} />
      <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
        Made by Sourabh Meena &middot; &copy; 2026
      </p>
    </div>
  );
}
