"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import Navigation from "../../components/Navigation";
import { API } from "../api";
import useAuth from "../useAuth";
import { useSettings, invalidateSettings } from "../../hooks/useAPI";
import { fadeUp } from "../../lib/motion";
import {
  KeyIcon, LogoutIcon, EyeIcon, EyeOffIcon, PlusIcon, MinusIcon, XIcon,
  ChevronDown, CheckCircleIcon, InfoIcon, BoltIcon, RefreshIcon, ClockIcon,
} from "../../components/icons";

interface ProfileData {
  email: string;
  created_at: string;
  topic_count: number;
  completed_revisions: number;
}

const fetcher = (url: string) => API.get(url).then((r) => r.data);

function Stepper({ value, onDec, onInc, onChange, minReached }: {
  value: number; onDec: () => void; onInc: () => void; onChange: (v: number) => void; minReached: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDec} disabled={minReached} aria-label="Decrease"
        className="grid place-items-center w-10 h-10 rounded-lg bg-surface-2 text-text hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <MinusIcon />
      </button>
      <input type="number" min={1} value={value} onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        className="rs-input w-16 text-center font-bold px-1" />
      <button onClick={onInc} aria-label="Increase"
        className="grid place-items-center w-10 h-10 rounded-lg bg-surface-2 text-text hover:bg-border transition-colors">
        <PlusIcon />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const isLoggedIn = useAuth();
  const { data: settings, isLoading: loading } = useSettings();
  const { data: profile } = useSWR<ProfileData>(isLoggedIn ? "/me" : null, fetcher);
  const [intervals, setIntervals] = useState<number[]>([]);
  const [repeatInterval, setRepeatInterval] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPwForm, setShowPwForm] = useState(false);
  const [showPwVisible, setShowPwVisible] = useState(false);

  useEffect(() => {
    if (settings) {
      setIntervals(settings.intervals);
      setRepeatInterval(settings.repeat_interval);
    }
  }, [settings]);

  const handleSave = async () => {
    if (intervals.length === 0) { setError("You need at least one interval"); return; }
    if (intervals.some((v) => v < 1)) { setError("All intervals must be at least 1 day"); return; }
    if (repeatInterval < 1) { setError("Repeat interval must be at least 1 day"); return; }
    setSaving(true); setError("");
    try {
      await API.patch("/settings", { intervals, repeat_interval: repeatInterval });
      invalidateSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to save settings");
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!settings) return;
    setSaving(true); setError("");
    try {
      await API.post("/settings/reset");
      invalidateSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Failed to reset settings"); }
    setSaving(false);
  };

  const updateInterval = (index: number, value: number) =>
    setIntervals((prev) => prev.map((v, i) => (i === index ? Math.max(1, value) : v)));
  const addInterval = () => setIntervals((prev) => [...prev, prev[prev.length - 1] || 7]);
  const removeInterval = (index: number) => {
    if (intervals.length <= 1) return;
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPw || !newPw) { setPwMsg({ type: "error", text: "Please fill in all fields" }); return; }
    if (newPw.length < 8) { setPwMsg({ type: "error", text: "New password must be at least 8 characters" }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: "New passwords don't match" }); return; }
    setPwSaving(true);
    try {
      await API.post("/me/change-password", { current_password: currentPw, new_password: newPw });
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setShowPwForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPwMsg({ type: "error", text: msg || "Failed to change password" });
    }
    setPwSaving(false);
  };

  const cumulativeDays = intervals.reduce<number[]>((acc, gap) => {
    acc.push((acc[acc.length - 1] ?? 0) + gap);
    return acc;
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="w-9 h-9 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="rs-container py-6 md:py-8 max-w-3xl">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-5 md:mb-6">
          <p className="rs-eyebrow">Account</p>
          <h1 className="rs-title text-2xl md:text-3xl mt-1">Settings</h1>
          <p className="text-sm text-muted mt-1">Your profile and revision-schedule preferences.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Profile */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5">
            <div className="flex items-center gap-4">
              <div className="grid place-items-center w-12 h-12 rounded-2xl text-white text-lg font-extrabold shrink-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500">
                {profile?.email?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text truncate">{profile?.email ?? "Loading…"}</p>
                <p className="text-xs text-muted mt-0.5">
                  {profile ? `Member since ${new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : " "}
                </p>
              </div>
            </div>
            {profile && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                <div className="rounded-xl bg-surface-2/60 p-3">
                  <p className="text-2xl font-extrabold text-text rs-tabular">{profile.topic_count}</p>
                  <p className="text-xs text-muted">Topics</p>
                </div>
                <div className="rounded-xl bg-surface-2/60 p-3">
                  <p className="text-2xl font-extrabold text-text rs-tabular">{profile.completed_revisions}</p>
                  <p className="text-xs text-muted">Revisions done</p>
                </div>
              </div>
            )}
            <button
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
              className="rs-btn w-full mt-4 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15"
            >
              <LogoutIcon /> Log out
            </button>
          </motion.div>

          {/* Change password */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card overflow-hidden self-start">
            <button onClick={() => { setShowPwForm((v) => !v); setPwMsg(null); }} className="w-full flex items-center justify-between p-5 text-left">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-surface-2 text-muted text-lg"><KeyIcon /></span>
                <span className="font-semibold text-text">Change password</span>
              </div>
              <ChevronDown className={`text-lg text-faint transition-transform ${showPwForm ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showPwForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <div className="px-5 pb-5 space-y-2.5">
                    <div className="relative">
                      <input type={showPwVisible ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="Current password" autoComplete="current-password" className="rs-input pr-11" />
                      <button type="button" onClick={() => setShowPwVisible((v) => !v)} aria-label={showPwVisible ? "Hide passwords" : "Show passwords"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-lg text-faint hover:text-text text-lg">
                        {showPwVisible ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <input type={showPwVisible ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)}
                      placeholder="New password (8+ characters)" autoComplete="new-password" className="rs-input" />
                    <input type={showPwVisible ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} placeholder="Confirm new password" autoComplete="new-password" className="rs-input" />
                    {pwMsg && (
                      <p className={`inline-flex items-center gap-1.5 text-sm ${pwMsg.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {pwMsg.type === "success" ? <CheckCircleIcon className="text-base" /> : <InfoIcon className="text-base" />} {pwMsg.text}
                      </p>
                    )}
                    <button onClick={handleChangePassword} disabled={pwSaving} className="rs-btn rs-btn-primary w-full">
                      {pwSaving ? "Changing…" : "Update password"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {loading ? (
          <div className="rs-card p-12 text-center text-muted">Loading settings…</div>
        ) : (
          <div className="space-y-5">
            {/* How it works */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5 border-l-4 border-l-indigo-500">
              <h3 className="flex items-center gap-2 rs-title text-base mb-2"><BoltIcon className="text-primary" /> How it works</h3>
              <p className="text-sm text-muted">
                Each interval is the <strong className="text-text">gap in days</strong> between consecutive reviews. After the initial
                intervals, revisions repeat at the <strong className="text-text">repeat interval</strong> forever — modelled on the{" "}
                <strong className="text-text">Ebbinghaus forgetting curve</strong>.
              </p>
            </motion.div>

            {/* Intervals */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="rs-title text-lg">Initial intervals</h3>
                {settings?.is_custom && <span className="rs-chip rs-chip-dynamic" style={{ ["--chip-bg" as string]: "rgba(168,85,247,0.12)", ["--chip-fg" as string]: "#7e22ce", ["--chip-bg-dark" as string]: "rgba(192,132,252,0.18)", ["--chip-fg-dark" as string]: "#d8b4fe" }}>Custom</span>}
              </div>
              <div className="space-y-2.5">
                <AnimatePresence>
                  {intervals.map((value, index) => (
                    <motion.div key={index} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3">
                      <span className="grid place-items-center w-8 h-8 rounded-full bg-primary-soft text-primary text-sm font-bold shrink-0 rs-tabular">{index + 1}</span>
                      <Stepper value={value} minReached={value <= 1}
                        onDec={() => updateInterval(index, value - 1)} onInc={() => updateInterval(index, value + 1)} onChange={(v) => updateInterval(index, v)} />
                      <span className="text-xs text-muted hidden sm:inline">days <span className="text-faint">· Day {cumulativeDays[index]}</span></span>
                      <button onClick={() => removeInterval(index)} disabled={intervals.length <= 1} aria-label="Remove interval"
                        className="ml-auto grid place-items-center w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <XIcon />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <button onClick={addInterval} className="w-full py-2.5 border-2 border-dashed border-border-strong rounded-xl text-muted hover:border-primary hover:text-primary transition-colors font-semibold inline-flex items-center justify-center gap-1.5">
                  <PlusIcon /> Add interval
                </button>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Repeat */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5 md:p-6">
                <h3 className="flex items-center gap-2 rs-title text-lg mb-1"><RefreshIcon className="text-primary" /> Repeat interval</h3>
                <p className="text-sm text-muted mb-4">After the initial intervals, revisions repeat at this gap forever.</p>
                <div className="flex items-center gap-2">
                  <Stepper value={repeatInterval} minReached={repeatInterval <= 1}
                    onDec={() => setRepeatInterval((v) => Math.max(1, v - 1))} onInc={() => setRepeatInterval((v) => v + 1)} onChange={(v) => setRepeatInterval(Math.max(1, v))} />
                  <span className="text-sm text-muted">days</span>
                </div>
              </motion.div>

              {/* Preview */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5 md:p-6">
                <h3 className="flex items-center gap-2 rs-title text-lg mb-1"><ClockIcon className="text-primary" /> Preview</h3>
                <p className="text-sm text-muted mb-4">If you add a topic today, you&apos;d revise on:</p>
                <div className="flex flex-wrap gap-2">
                  {cumulativeDays.map((day, i) => (
                    <span key={i} className="rs-chip rs-chip-muted">Day {day}</span>
                  ))}
                  <span className="rs-chip bg-primary-soft text-primary">then /{repeatInterval}d</span>
                </div>
              </motion.div>
            </div>

            {error && (
              <div className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-xl w-full">
                <InfoIcon className="text-base" /> {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button onClick={handleSave} disabled={saving} className="rs-btn rs-btn-primary">
                {saving ? "Saving…" : saved ? <><CheckCircleIcon /> Saved!</> : "Save settings"}
              </button>
              <button onClick={handleReset} disabled={saving} className="rs-btn rs-btn-outline">Reset to defaults</button>
            </div>

            <div className="rs-card p-4 border-l-4 border-l-amber-400">
              <p className="text-sm text-muted">
                <strong className="text-text">Note:</strong> Changing intervals only affects <strong className="text-text">future topics</strong>. Existing topics keep their schedule.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-faint py-8">Made by Sourabh Meena · © 2026</p>
      </main>
    </>
  );
}
