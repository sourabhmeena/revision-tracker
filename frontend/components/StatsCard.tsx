"use client";

import { motion } from "framer-motion";
import { useTopics, useStreaks, useTodayRevisions } from "../hooks/useAPI";
import { fadeUp, staggerContainer, fadeUpSm } from "../lib/motion";
import CountUp from "./CountUp";
import TiltCard from "./TiltCard";
import { LayersIcon, CheckCircleIcon, ClockIcon, FlameIcon } from "./icons";

function Tile({
  icon, value, label, accent, delayKey,
}: {
  icon: React.ReactNode; value: number; label: string; accent: string; delayKey: string;
}) {
  return (
    <motion.div
      key={delayKey}
      variants={fadeUpSm}
      className="rounded-[var(--radius-md)] border border-border bg-surface-2/60 p-3.5"
    >
      <span className={`grid place-items-center w-9 h-9 rounded-lg text-lg mb-2 ${accent}`}>{icon}</span>
      <div className="text-2xl font-extrabold rs-tabular text-text leading-none">
        <CountUp value={value} />
      </div>
      <div className="text-xs font-medium text-muted mt-1">{label}</div>
    </motion.div>
  );
}

export default function StatsCard() {
  const { data: topics = [] } = useTopics();
  const { data: streaks } = useStreaks();
  const { data: today } = useTodayRevisions();

  const totalTopics = topics.length;
  const completed = topics.reduce((s, t) => s + (t.completed_revisions || 0), 0);
  const dueToday = today?.topics?.length ?? 0;
  const streak = streaks?.current_streak ?? 0;

  return (
    <TiltCard variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5">
      <h3 className="rs-eyebrow mb-3">Your progress</h3>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5">
        <Tile delayKey="t" icon={<LayersIcon />} value={totalTopics} label="Topics" accent="bg-indigo-500/12 text-indigo-500" />
        <Tile delayKey="c" icon={<CheckCircleIcon />} value={completed} label="Revisions done" accent="bg-emerald-500/12 text-emerald-500" />
        <Tile delayKey="d" icon={<ClockIcon />} value={dueToday} label="Due today" accent="bg-violet-500/12 text-violet-500" />
        <Tile delayKey="s" icon={<FlameIcon />} value={streak} label="Day streak" accent="bg-amber-500/15 text-amber-500" />
      </motion.div>
    </TiltCard>
  );
}
