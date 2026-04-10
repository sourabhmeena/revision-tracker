"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { API } from "../app/api";

interface LoginFormProps {
  onLogin: (token: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const submitForm = async () => {
    if (!email.trim() || !emailRegex.test(email)) {
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
      className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-auto"
    >
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-lg text-gray-600">Sign in to your account</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            tab === "login"
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            tab === "register"
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-600 hover:text-gray-800"
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
          className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-xl font-medium text-gray-900 text-center bg-white shadow-inner focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:shadow-lg transition-all duration-200 placeholder-gray-500"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ chars)"
            className="w-full px-4 py-4 pr-12 border-2 border-gray-300 rounded-xl text-xl font-medium text-gray-900 text-center bg-white shadow-inner focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:shadow-lg transition-all duration-200 placeholder-gray-500"
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
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg shadow-lg focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
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