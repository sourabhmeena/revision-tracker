"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../app/api";
import ModalShell from "./ModalShell";
import { PlusIcon, MinusIcon, XIcon, CheckIcon, InfoIcon } from "./icons";

interface TopicScheduleEditorProps {
  topicId: string;
  topicTitle: string;
  currentIntervals: number[];
  currentRepeat: number;
  hasCustom: boolean;
  onSaved: () => void;
  onClose: () => void;
}

function MiniStepper({ value, onDec, onInc, onChange, minReached }: {
  value: number; onDec: () => void; onInc: () => void; onChange: (v: number) => void; minReached: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDec} disabled={minReached} aria-label="Decrease"
        className="grid place-items-center w-8 h-8 rounded-lg bg-surface-2 text-text hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <MinusIcon className="text-sm" />
      </button>
      <input type="number" min={1} value={value} onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        className="rs-input w-14 text-center font-bold px-1 py-1.5 min-h-0 h-9" />
      <button onClick={onInc} aria-label="Increase"
        className="grid place-items-center w-8 h-8 rounded-lg bg-surface-2 text-text hover:bg-border transition-colors">
        <PlusIcon className="text-sm" />
      </button>
    </div>
  );
}

export default function TopicScheduleEditor({
  topicId, topicTitle, currentIntervals, currentRepeat, hasCustom, onSaved, onClose,
}: TopicScheduleEditorProps) {
  const [intervals, setIntervals] = useState<number[]>(currentIntervals);
  const [repeatInterval, setRepeatInterval] = useState(currentRepeat);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateInterval = (index: number, value: number) =>
    setIntervals((prev) => prev.map((v, i) => (i === index ? Math.max(1, value) : v)));
  const addInterval = () => setIntervals((prev) => [...prev, prev[prev.length - 1] || 7]);
  const removeInterval = (index: number) => {
    if (intervals.length <= 1) return;
    setIntervals((prev) => prev.filter((_, i) => i !== index));
  };

  const cumulativeDays = intervals.reduce<number[]>((acc, gap) => {
    acc.push((acc[acc.length - 1] ?? 0) + gap);
    return acc;
  }, []);

  const handleSave = async () => {
    if (intervals.length === 0 || intervals.some((v) => v < 1) || repeatInterval < 1) {
      setError("All values must be at least 1 day");
      return;
    }
    setSaving(true); setError("");
    try {
      await API.patch(`/topics/${topicId}/schedule`, { intervals, repeat_interval: repeatInterval });
      onSaved();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to save schedule");
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true); setError("");
    try {
      const res = await API.post(`/topics/${topicId}/schedule/reset`);
      setIntervals(res.data.intervals);
      setRepeatInterval(res.data.repeat_interval);
      onSaved();
    } catch { setError("Failed to reset schedule"); }
    setSaving(false);
  };

  return (
    <ModalShell onClose={onClose} className="max-w-lg max-h-[88vh] flex flex-col p-0" labelledBy="sched-title">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 md:px-6 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="sched-title" className="rs-title text-lg">Edit schedule</h2>
          <p className="text-sm text-muted truncate">{topicTitle}</p>
        </div>
        {hasCustom && <span className="rs-chip bg-primary-soft text-primary shrink-0">Custom</span>}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5 space-y-5">
        <div>
          <h3 className="rs-eyebrow mb-3">Review intervals (gap in days)</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {intervals.map((value, index) => (
                <motion.div key={index} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2">
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-primary-soft text-primary text-xs font-bold shrink-0 rs-tabular">{index + 1}</span>
                  <MiniStepper value={value} minReached={value <= 1}
                    onDec={() => updateInterval(index, value - 1)} onInc={() => updateInterval(index, value + 1)} onChange={(v) => updateInterval(index, v)} />
                  <span className="text-xs text-faint">Day {cumulativeDays[index]}</span>
                  <button onClick={() => removeInterval(index)} disabled={intervals.length <= 1} aria-label="Remove"
                    className="ml-auto grid place-items-center w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
                    <XIcon className="text-sm" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <button onClick={addInterval} className="w-full py-2 border-2 border-dashed border-border-strong rounded-xl text-muted hover:border-primary hover:text-primary transition-colors text-sm font-semibold inline-flex items-center justify-center gap-1.5">
              <PlusIcon className="text-sm" /> Add interval
            </button>
          </div>
        </div>

        <div>
          <h3 className="rs-eyebrow mb-2">Then repeat every</h3>
          <div className="flex items-center gap-2">
            <MiniStepper value={repeatInterval} minReached={repeatInterval <= 1}
              onDec={() => setRepeatInterval((v) => Math.max(1, v - 1))} onInc={() => setRepeatInterval((v) => v + 1)} onChange={(v) => setRepeatInterval(Math.max(1, v))} />
            <span className="text-sm text-muted">days, forever</span>
          </div>
        </div>

        <div className="rounded-xl bg-surface-2/60 p-4 border border-border">
          <h4 className="rs-eyebrow mb-2">Preview</h4>
          <div className="flex flex-wrap gap-1.5">
            {cumulativeDays.map((day, i) => <span key={i} className="rs-chip rs-chip-muted">Day {day}</span>)}
            <span className="rs-chip bg-primary-soft text-primary">+{repeatInterval}d forever</span>
          </div>
        </div>

        <div className="rounded-xl p-3 border-l-4 border-l-amber-400 bg-amber-400/5">
          <p className="text-xs text-muted"><strong className="text-text">Note:</strong> Completed revisions are kept. Only uncompleted future revisions are regenerated.</p>
        </div>

        {error && (
          <div className="inline-flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg w-full">
            <InfoIcon className="text-base" /> {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 md:px-6 py-4 flex flex-wrap items-center gap-2">
        <button onClick={handleSave} disabled={saving} className="rs-btn rs-btn-primary">
          <CheckIcon /> {saving ? "Saving…" : "Save & reschedule"}
        </button>
        {hasCustom && <button onClick={handleReset} disabled={saving} className="rs-btn rs-btn-outline">Reset to default</button>}
        <button onClick={onClose} className="rs-btn rs-btn-ghost ml-auto">Cancel</button>
      </div>
    </ModalShell>
  );
}
