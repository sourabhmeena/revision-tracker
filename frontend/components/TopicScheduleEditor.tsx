"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../app/api";

interface TopicScheduleEditorProps {
  topicId: string;
  topicTitle: string;
  currentIntervals: number[];
  currentRepeat: number;
  hasCustom: boolean;
  onSaved: () => void;
  onClose: () => void;
}

export default function TopicScheduleEditor({
  topicId,
  topicTitle,
  currentIntervals,
  currentRepeat,
  hasCustom,
  onSaved,
  onClose,
}: TopicScheduleEditorProps) {
  const [intervals, setIntervals] = useState<number[]>(currentIntervals);
  const [repeatInterval, setRepeatInterval] = useState(currentRepeat);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const handleSave = async () => {
    if (intervals.length === 0 || intervals.some((v) => v < 1) || repeatInterval < 1) {
      setError("All values must be at least 1 day");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await API.patch(`/topics/${topicId}/schedule`, {
        intervals,
        repeat_interval: repeatInterval,
      });
      onSaved();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to save schedule");
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await API.post(`/topics/${topicId}/schedule/reset`);
      setIntervals(res.data.intervals);
      setRepeatInterval(res.data.repeat_interval);
      onSaved();
    } catch {
      setError("Failed to reset schedule");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Schedule</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{topicTitle}</p>
            </div>
            {hasCustom && (
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                Custom
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Intervals */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Review Intervals (days between reviews)</h3>
            <div className="space-y-2">
              <AnimatePresence>
                {intervals.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <button
                      onClick={() => updateInterval(index, value - 1)}
                      disabled={value <= 1}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                    >
                      &minus;
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={value}
                      onChange={(e) => updateInterval(index, parseInt(e.target.value) || 1)}
                      className="w-16 text-center px-2 py-1.5 border border-gray-300 rounded-lg text-gray-900 font-semibold text-sm focus:border-violet-500 focus:ring-0 outline-none"
                    />
                    <button
                      onClick={() => updateInterval(index, value + 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors text-sm"
                    >
                      +
                    </button>
                    <span className="text-xs text-gray-400">Day {cumulativeDays[index]}</span>
                    <div className="flex-grow" />
                    <button
                      onClick={() => removeInterval(index)}
                      disabled={intervals.length <= 1}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      &times;
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button
                onClick={addInterval}
                className="w-full py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-violet-400 hover:text-violet-600 transition-colors text-sm font-medium"
              >
                + Add interval
              </button>
            </div>
          </div>

          {/* Repeat */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Then repeat every</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRepeatInterval((v) => Math.max(1, v - 1))}
                disabled={repeatInterval <= 1}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              >
                &minus;
              </button>
              <input
                type="number"
                min={1}
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center px-2 py-1.5 border border-gray-300 rounded-lg text-gray-900 font-semibold text-sm focus:border-violet-500 focus:ring-0 outline-none"
              />
              <button
                onClick={() => setRepeatInterval((v) => v + 1)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors text-sm"
              >
                +
              </button>
              <span className="text-sm text-gray-500">days</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</h4>
            <div className="flex flex-wrap gap-1.5">
              {cumulativeDays.map((day, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-800">
                  Day {day}
                </span>
              ))}
              <span className="px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs font-medium text-purple-800">
                +{repeatInterval}d forever
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Completed revisions are kept. Only uncompleted future revisions will be
              regenerated with the new schedule.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-6 py-4 rounded-b-2xl flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 md:px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? "Saving..." : "Save & Reschedule"}
          </button>
          {hasCustom && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 md:px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              Reset to Default
            </button>
          )}
          <div className="flex-grow" />
          <button
            onClick={onClose}
            className="px-4 md:px-5 py-2.5 text-gray-500 hover:text-gray-700 font-medium rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
