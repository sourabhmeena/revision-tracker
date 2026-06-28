"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../app/api";
import { springSoft } from "../lib/motion";
import { LockIcon, EyeIcon, EyeOffIcon, InfoIcon, ArrowRight } from "./icons";

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
      setError("Please enter a valid email address");
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
      setError(axiosErr.response?.data?.detail || axiosErr.message || "Login / Register failed");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rs-card w-full max-w-md p-6 md:p-8 shadow-[var(--shadow-lg)]"
    >
      <div className="text-center mb-6 lg:hidden">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl grid place-items-center text-white text-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[var(--shadow-primary)]">
          <LockIcon />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-text">
          {tab === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-muted mt-1">
          {tab === "login" ? "Sign in to keep your streak alive" : "Start learning the smart way"}
        </p>
      </div>

      <h2 className="hidden lg:block text-2xl font-extrabold tracking-tight text-text mb-1">
        {tab === "login" ? "Welcome back" : "Create your account"}
      </h2>
      <p className="hidden lg:block text-sm text-muted mb-6">
        {tab === "login" ? "Sign in to keep your streak alive" : "Start learning the smart way"}
      </p>

      {/* Tabs */}
      <div className="rs-segment w-full mb-5">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            className={`relative flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              tab === t ? "text-on-primary" : "text-muted hover:text-text"
            }`}
          >
            {tab === t && (
              <motion.span
                layoutId="auth-tab"
                transition={springSoft}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_6px_16px_-6px_rgba(109,40,217,0.5)]"
              />
            )}
            <span className="relative">{t === "login" ? "Login" : "Register"}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            role="alert"
            className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 rounded-xl"
          >
            <InfoIcon className="text-base shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submitForm()}
            placeholder="your@email.com"
            className="rs-input"
          />
        </div>
        <div className="relative">
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submitForm()}
            placeholder="Password (8+ characters)"
            className="rs-input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-lg text-faint hover:text-text hover:bg-surface-2 text-lg"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <button onClick={submitForm} disabled={loading} className="rs-btn rs-btn-primary w-full text-base">
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {tab === "login" ? "Signing in…" : "Creating account…"}
            </>
          ) : (
            <>
              {tab === "login" ? "Sign in" : "Create account"} <ArrowRight />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
