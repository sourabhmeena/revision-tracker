"use client";

import { useEffect, useState } from "react";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      window.location.href = "/";
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <LoginForm onLogin={handleLogin} />
    </div>
  );
}
