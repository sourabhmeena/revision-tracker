"use client";

import { motion } from "framer-motion";
import Navigation from "../../components/Navigation";
import UpcomingList from "../../components/UpcomingList";
import StreakDisplay from "../../components/StreakDisplay";
import useAuth from "../useAuth";
import { useStreaks } from "../../hooks/useAPI";
import { fadeUp } from "../../lib/motion";

export default function ListView() {
  const isLoggedIn = useAuth();
  const { data: streakData, isLoading: loadingStreak } = useStreaks();

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
      <main className="mx-auto w-full max-w-4xl px-4 md:px-8 py-6 md:py-8">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-5 md:mb-6">
          <p className="rs-eyebrow">Schedule</p>
          <h1 className="rs-title text-2xl md:text-3xl mt-1">Revision timeline</h1>
          <p className="text-sm text-muted mt-1">Every revision day in chronological order.</p>
        </motion.div>

        {!loadingStreak && streakData && (
          <div className="mb-6">
            <StreakDisplay
              currentStreak={streakData.current_streak}
              longestStreak={streakData.longest_streak}
              nextMilestone={streakData.next_milestone.target}
              milestoneProgress={streakData.next_milestone.progress}
              daysRemaining={streakData.next_milestone.days_remaining}
            />
          </div>
        )}

        <UpcomingList />
      </main>
    </>
  );
}
