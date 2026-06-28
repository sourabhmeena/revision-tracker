"use client";

import { motion } from "framer-motion";
import CountUp from "./CountUp";
import TiltCard from "./TiltCard";
import { FlameIcon, TrophyIcon, TargetIcon } from "./icons";
import { fadeUp } from "../lib/motion";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  nextMilestone?: number;
  milestoneProgress?: number;
  daysRemaining?: number;
}

export default function StreakDisplay({
  currentStreak,
  longestStreak,
  nextMilestone,
  milestoneProgress,
  daysRemaining,
}: StreakDisplayProps) {
  const active = currentStreak > 0;

  return (
    <TiltCard
      max={6}
      glare={false}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-[var(--radius-xl)] p-5 md:p-6 text-white shadow-[var(--shadow-float-lg)]"
      style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f43f5e 45%, #7c3aed 100%)" }}
    >
      {/* soft light blooms */}
      <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-fuchsia-500/30 blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-5 md:gap-0">
        {/* Current streak */}
        <div className="flex-1 flex items-center gap-4">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <span className={`text-4xl drop-shadow ${active ? "rs-flame" : ""}`}>
              <FlameIcon gradientId="streak-flame" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Current streak</p>
            <div className="flex items-baseline gap-1.5">
              <CountUp value={currentStreak} className="text-4xl md:text-5xl font-extrabold rs-tabular leading-none" />
              <span className="text-lg md:text-xl font-semibold text-white/90">days</span>
            </div>
            <p className="text-xs text-white/75 mt-1">{active ? "Keep it going!" : "Start your streak today"}</p>
          </div>
        </div>

        <div className="hidden md:block w-px h-20 bg-white/25 mx-6" />
        <div className="md:hidden h-px w-full bg-white/20" />

        {/* Best streak */}
        <div className="flex-1 flex items-center gap-4">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <span className="text-3xl text-amber-200"><TrophyIcon /></span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Best streak</p>
            <div className="flex items-baseline gap-1.5">
              <CountUp value={longestStreak} className="text-4xl md:text-5xl font-extrabold rs-tabular leading-none" />
              <span className="text-lg md:text-xl font-semibold text-white/90">days</span>
            </div>
            <p className="text-xs text-white/75 mt-1">Personal record</p>
          </div>
        </div>
      </div>

      {/* Milestone progress */}
      {active && nextMilestone && (
        <div className="relative mt-5 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="inline-flex items-center gap-1.5 text-white/85">
              <TargetIcon className="text-base" /> Next milestone
            </span>
            <span className="font-bold">
              {daysRemaining !== undefined && daysRemaining > 0
                ? `${nextMilestone} days · ${daysRemaining} to go`
                : "Milestone reached!"}
            </span>
          </div>
          <div className="w-full bg-black/15 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-200 to-white"
              initial={{ width: 0 }}
              animate={{ width: `${milestoneProgress || 0}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </div>
        </div>
      )}
    </TiltCard>
  );
}
