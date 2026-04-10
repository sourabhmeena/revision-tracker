"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { API } from "../app/api";

interface LoginFormProps {
  onLogin: (token: string) => void;
}

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitForm = async () => {
    if (!email.trim() || !EMAIL_RE.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const endpoint = tab === "login" ? "/login" : "/register";
      const res = await API.post(endpoint, { email, password });
      localStorage.setItem("token", res.data.token);
      onLogin(res.data.token);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.detail ||
          axiosErr.message ||
          "Login/Register failed"
      );
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-auto"
    >
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome Back</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">Sign in to your account</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            tab === "login"
              ? "bg-white dark:bg-gray-600 shadow-sm text-sky-600 dark:text-sky-400"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            tab === "register"
              ? "bg-white dark:bg-gray-600 shadow-sm text-sky-600 dark:text-sky-400"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          }`}
        >
          Register
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-xl font-medium text-gray-900 dark:text-gray-100 text-center bg-white dark:bg-gray-700 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:shadow-lg transition-all duration-200 placeholder-gray-500"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ chars)"
            className="w-full px-4 py-4 pr-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-xl font-medium text-gray-900 dark:text-gray-100 text-center bg-white dark:bg-gray-700 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:shadow-lg transition-all duration-200 placeholder-gray-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
        
        <button
          onClick={submitForm}
          disabled={loading}
          className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-lg shadow-lg focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {tab === "login" ? "Signing in..." : "Creating account..."}
            </span>
          ) : tab === "login" ? "Login" : "Create Account"}
        </button>
      </div>
    </motion.div>
  );
}