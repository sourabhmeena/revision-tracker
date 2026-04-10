"use client";

import { useEffect } from "react";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  useEffect(() => {
    if (localStorage.getItem("token")) {
      window.location.href = "/";
    }
  }, []);

  const handleLogin = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <LoginForm onLogin={handleLogin} />
    </div>
  );
}
