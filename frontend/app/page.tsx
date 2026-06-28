"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "../components/Navigation";
import TopicForm from "../components/TopicForm";
import TodayWidget from "../components/TodayWidget";
import StatsCard from "../components/StatsCard";
import useAuth from "./useAuth";
import { useStreaks, useRevisions, localIso } from "../hooks/useAPI";
import { fadeUp } from "../lib/motion";
import { FlameIcon, ArrowRight, CalendarIcon, ClockIcon } from "../components/icons";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Greeting() {
  const { data: streaks } = useStreaks();
  const streak = streaks?.current_streak ?? 0;
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.header
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex items-start justify-between gap-4"
    >
      <div>
        <p className="rs-eyebrow">{date}</p>
        <h1 className="rs-title text-2xl md:text-3xl mt-1">
          {greeting()}, <span className="rs-gradient-text">learner</span>
        </h1>
      </div>
      {streak > 0 && (
        <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-surface border border-border px-3 py-1.5 shadow-[var(--shadow-xs)]">
          <span className="text-amber-500 text-lg rs-flame"><FlameIcon gradientId="hdr-flame" /></span>
          <span className="text-sm font-bold rs-tabular text-text">{streak}</span>
          <span className="text-xs text-muted hidden sm:inline">day streak</span>
        </div>
      )}
    </motion.header>
  );
}

function UpNext() {
  const { data: list = [] } = useRevisions();
  const today = localIso();
  const upcoming = list
    .filter((i) => i.iso_date >= today && i.done < i.total)
    .sort((a, b) => a.iso_date.localeCompare(b.iso_date))
    .slice(0, 4);

  if (upcoming.length === 0) return null;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="rs-eyebrow">Up next</h3>
        <Link href="/list" className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:gap-1.5 transition-all">
          View all <ArrowRight className="text-sm" />
        </Link>
      </div>
      <ul className="space-y-1">
        {upcoming.map((item) => {
          const remaining = item.total - item.done;
          const isToday = item.iso_date === today;
          return (
            <li key={item.iso_date}>
              <Link
                href="/list"
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2 transition-colors"
              >
                <span className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${isToday ? "bg-violet-500/12 text-violet-500" : "bg-surface-2 text-muted"}`}>
                  {isToday ? <ClockIcon /> : <CalendarIcon />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text truncate">
                    {isToday ? "Today" : (item.date || item.iso_date)}
                  </div>
                  <div className="text-xs text-muted">{remaining} revision{remaining !== 1 ? "s" : ""} left</div>
                </div>
                <span className="text-xs font-bold rs-tabular text-muted">{item.done}/{item.total}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

export default function Home() {
  const isLoggedIn = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-border border-t-primary animate-spin" />
          <p className="text-muted text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="rs-container py-6 md:py-8">
        <Greeting />
        <div className="grid gap-5 md:grid-cols-12 md:gap-6 mt-5 md:mt-6">
          <div className="md:col-span-7 xl:col-span-8 space-y-5 md:space-y-6">
            <TodayWidget />
            <TopicForm />
          </div>
          <aside className="md:col-span-5 xl:col-span-4 space-y-5 md:space-y-6">
            <StatsCard />
            <UpNext />
          </aside>
        </div>
      </main>
    </>
  );
}
