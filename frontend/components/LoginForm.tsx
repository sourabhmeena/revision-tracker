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
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full mx-auto"
    >
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome Back</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to your account</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-5">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
            tab === "login"
              ? "bg-white dark:bg-gray-600 shadow-sm text-violet-600 dark:text-violet-400"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
            tab === "register"
              ? "bg-white dark:bg-gray-600 shadow-sm text-violet-600 dark:text-violet-400"
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
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 transition-all duration-200 placeholder-gray-400"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ chars)"
            className="w-full px-4 py-3 pr-11 border border-gray-300 dark:border-gray-600 rounded-xl text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 transition-all duration-200 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
        
        <button
          onClick={submitForm}
          disabled={loading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-base shadow-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
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