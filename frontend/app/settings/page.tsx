"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "../../components/Navigation";
import { API } from "../api";
import useAuth from "../useAuth";
import { useSettings, invalidateSettings } from "../../hooks/useAPI";

export default function SettingsPage() {
  const isLoggedIn = useAuth();
  const { data: settings, isLoading: loading } = useSettings();
  const [intervals, setIntervals] = useState<number[]>([]);
  const [repeatInterval, setRepeatInterval] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
              Revision Schedule Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Customise the spaced repetition intervals used when creating new topics
            </p>
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
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
