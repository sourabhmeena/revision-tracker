"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "../../components/Navigation";
import { API } from "../api";
import useAuth from "../useAuth";
import { useSettings, invalidateSettings } from "../../hooks/useAPI";
import useSWR from "swr";

interface ProfileData {
  email: string;
  created_at: string;
  topic_count: number;
  completed_revisions: number;
}

const fetcher = (url: string) => API.get(url).then((r) => r.data);

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
    if (intervals.length === 0) {
      setError("You need at least one interval");
      return;
    }
    if (intervals.some((v) => v < 1)) {
      setError("All intervals must be at least 1 day");
      return;
    }
    if (repeatInterval < 1) {
      setError("Repeat interval must be at least 1 day");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await API.patch("/settings", {
        intervals,
        repeat_interval: repeatInterval,
      });
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
    setSaving(true);
    setError("");
    try {
      await API.post("/settings/reset");
      invalidateSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to reset settings");
    }
    setSaving(false);
  };

  const updateInterval = (index: number, value: number) => {
    setIntervals((prev) => prev.map((v, i) => (i === index ? Math.max(1, value) : v)));
  };

  const addInterval = () => {
    const last = intervals[intervals.length - 1] || 7;
    setIntervals((prev) => [...prev, last]);
  };

  const removeInterval = (index: number) => {
    if (intervals.length <= 1) return;
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPw || !newPw) {
      setPwMsg({ type: "error", text: "Please fill in all fields" });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "New passwords don't match" });
      return;
    }
    setPwSaving(true);
    try {
      await API.post("/me/change-password", {
        current_password: currentPw,
        new_password: newPw,
      });
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setShowPwForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPwMsg({ type: "error", text: msg || "Failed to change password" });
    }
    setPwSaving(false);
  };

  const cumulativeDays = intervals.reduce<number[]>((acc, gap) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(prev + gap);
    return acc;
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your profile and revision schedule preferences
            </p>
          </div>

          {/* ── Profile card ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 via-violet-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {profile?.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {profile?.email ?? "Loading..."}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {profile ? `Member since ${new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : "\u00A0"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/login";
                }}
                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
              >
                Logout
              </button>
            </div>

            {profile && (
              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.topic_count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Topics</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.completed_revisions}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Revisions completed</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Change Password ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 overflow-hidden">
            <button
              onClick={() => { setShowPwForm((v) => !v); setPwMsg(null); }}
              className="w-full flex items-center justify-between p-5 md:p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-600 dark:text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Change Password</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 text-gray-400 transition-transform ${showPwForm ? "rotate-180" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <AnimatePresence>
              {showPwForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-3">
                    <div className="relative">
                      <input
                        type={showPwVisible ? "text" : "password"}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="Current password"
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwVisible((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPwVisible ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPwVisible ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="New password (8+ characters)"
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type={showPwVisible ? "text" : "password"}
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Confirm new password"
                        onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm"
                      />
                    </div>
                    {pwMsg && (
                      <p className={`text-sm ${pwMsg.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {pwMsg.text}
                      </p>
                    )}
                    <button
                      onClick={handleChangePassword}
                      disabled={pwSaving}
                      className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {pwSaving ? "Changing..." : "Update Password"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading settings...</div>
          ) : (
            <div className="space-y-6">
              {/* Explanation card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  How it works
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  Each interval is the <strong>gap in days</strong> between consecutive reviews.
                  After the initial intervals, revisions repeat at the <strong>repeat interval</strong> indefinitely.
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Based on the <strong>Ebbinghaus forgetting curve</strong> &mdash; review just before you&apos;d
                  forget, with gaps growing each time to strengthen long-term memory.
                </p>
              </div>

              {/* Intervals editor */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Initial Intervals</h3>
                  {settings?.is_custom && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                      Custom
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {intervals.map((value, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs md:text-sm font-bold shrink-0">
                          {index + 1}
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2 flex-grow min-w-0">
                          <button
                            onClick={() => updateInterval(index, value - 1)}
                            disabled={value <= 1}
                            className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                          >
                            &minus;
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={value}
                            onChange={(e) => updateInterval(index, parseInt(e.target.value) || 1)}
                            className="w-14 md:w-20 text-center px-2 md:px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 font-semibold text-base focus:border-blue-500 focus:ring-0 outline-none"
                          />
                          <button
                            onClick={() => updateInterval(index, value + 1)}
                            className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-lg transition-colors shrink-0"
                          >
                            +
                          </button>
                          <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 ml-1 hidden sm:inline">
                            days <span className="text-gray-400 dark:text-gray-500">(Day {cumulativeDays[index]})</span>
                          </span>
                        </div>

                        <button
                          onClick={() => removeInterval(index)}
                          disabled={intervals.length <= 1}
                          className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                          title="Remove"
                        >
                          &times;
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button
                    onClick={addInterval}
                    className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                  >
                    + Add interval
                  </button>
                </div>
              </div>

              {/* Repeat interval */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Repeat Interval</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  After the initial intervals above, revisions repeat at this interval forever.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRepeatInterval((v) => Math.max(1, v - 1))}
                    disabled={repeatInterval <= 1}
                    className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    &minus;
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 font-semibold focus:border-blue-500 focus:ring-0 outline-none"
                  />
                  <button
                    onClick={() => setRepeatInterval((v) => v + 1)}
                    className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
                </div>
              </div>

              {/* Preview timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Preview</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  If you create a topic today, here&apos;s when you&apos;d revise:
                </p>
                <div className="flex flex-wrap gap-2">
                  {cumulativeDays.map((day, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium text-blue-800 dark:text-blue-300"
                    >
                      Day {day}
                    </div>
                  ))}
                  <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-medium text-purple-800 dark:text-purple-300">
                    then every {repeatInterval}d
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
                </button>

                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Reset to Defaults
                </button>

                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-green-600 dark:text-green-400 font-medium text-sm"
                  >
                    Settings saved successfully
                  </motion.span>
                )}
              </div>

              {/* Note */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Note:</strong> Changing your intervals only affects <strong>future topics</strong>.
                  Existing topics keep their original schedule.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
