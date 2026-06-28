"use client";

import { motion } from "framer-motion";
import Navigation from "../../components/Navigation";
import CalendarGrid from "../../components/CalendarGrid";
import useAuth from "../useAuth";
import { fadeUp } from "../../lib/motion";

const LEGEND = [
  { label: "Scheduled", cls: "border-violet-500/60 bg-violet-500/10" },
  { label: "All done", cls: "border-emerald-500/60 bg-emerald-500/10" },
  { label: "Overdue", cls: "border-rose-500/60 bg-rose-500/10" },
  { label: "Today", cls: "border-violet-500 ring-2 ring-violet-500/40" },
];

export default function CalendarView() {
  const isLoggedIn = useAuth();

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
      <main className="rs-container py-6 md:py-8 max-w-5xl">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-5 md:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="rs-eyebrow">Overview</p>
            <h1 className="rs-title text-2xl md:text-3xl mt-1">Calendar</h1>
            <p className="text-sm text-muted mt-1">Your revision schedule, month by month.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGEND.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-muted">
                <span className={`w-3.5 h-3.5 rounded-md border ${l.cls}`} /> {l.label}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-2 md:p-5">
          <CalendarGrid />
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-5 rs-card p-5">
          <h3 className="rs-eyebrow mb-3">Tips</h3>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted">
            <p>• Tap <strong className="text-text">month/year</strong> to jump anywhere.</p>
            <p>• Use <strong className="text-text">←/→</strong> or arrow keys to switch months.</p>
            <p>• Tap <strong className="text-text">Today</strong> to return to this month.</p>
            <p>• Tap any date to view and tick off its revisions.</p>
          </div>
        </motion.div>
      </main>
    </>
  );
}
