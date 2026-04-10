"use client";

import { motion } from "framer-motion";

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
  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 md:p-6 text-white shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
        {/* Current Streak */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="text-3xl md:text-4xl"
              animate={{
                scale: currentStreak > 0 ? [1, 1.2, 1] : 1,
                rotate: currentStreak > 0 ? [0, 10, -10, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                repeat: currentStreak > 0 ? Infinity : 0,
                repeatDelay: 3,
              }}
            >
              🔥
            </motion.div>
            <div>
              <h3 className="text-base md:text-lg font-semibold">Current Streak</h3>
              <p className="text-xs md:text-sm text-orange-100">Keep it going!</p>
            </div>
          </div>
          <motion.div
            key={currentStreak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl md:text-5xl font-bold"
          >
            {currentStreak}
            <span className="text-lg md:text-2xl ml-2">days</span>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-24 bg-white/30 mx-6"></div>
        <div className="md:hidden h-px w-full bg-white/30"></div>

        {/* Longest Streak */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl md:text-4xl">🏆</div>
            <div>
              <h3 className="text-base md:text-lg font-semibold">Best Streak</h3>
              <p className="text-xs md:text-sm text-orange-100">Personal record</p>
            </div>
          </div>
          <div className="text-3xl md:text-5xl font-bold">
            {longestStreak}
            <span className="text-lg md:text-2xl ml-2">days</span>
          </div>
        </div>
      </div>

      {/* Progress towards milestones */}
      {currentStreak > 0 && nextMilestone && (
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/30">
          <div className="flex items-center justify-between text-xs md:text-sm mb-2">
            <span>Next milestone:</span>
            <span className="font-bold">
              {daysRemaining !== undefined && daysRemaining > 0
                ? `${nextMilestone} days (${daysRemaining} to go)`
                : "🎉 Milestone reached!"}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${milestoneProgress || 0}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
