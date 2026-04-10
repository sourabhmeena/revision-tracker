"use client";

import Navigation from "../../components/Navigation";
import UpcomingList from "../../components/UpcomingList";
import StreakDisplay from "../../components/StreakDisplay";
import useAuth from "../useAuth";
import { useStreaks } from "../../hooks/useAPI";

export default function ListView() {
  const isLoggedIn = useAuth();
  const { data: streakData, isLoading: loadingStreak } = useStreaks();

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
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              List View
            </h1>
            <p className="text-gray-600">
              View all your upcoming revisions in chronological order
            </p>
          </div>

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
        </div>
      </div>
    </>
  );
}
