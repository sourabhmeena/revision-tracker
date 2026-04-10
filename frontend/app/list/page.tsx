"use client";

import { useState, useEffect, useCallback } from "react";
import Navigation from "../../components/Navigation";
import UpcomingList from "../../components/UpcomingList";
import StreakDisplay from "../../components/StreakDisplay";
import { API } from "../api";
import useAuth from "../useAuth";
import type { StreakData } from "../types";

export default function ListView() {
  const isLoggedIn = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);

  const triggerRefresh = () => setRefreshKey((n) => n + 1);

  const loadStreaks = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingStreak(true);
    try {
      const res = await API.get<StreakData>("/streaks");
      setStreakData(res.data);
    } catch (error) {
      console.error("Failed to load streaks:", error);
    }
    setLoadingStreak(false);
  }, [isLoggedIn]);

  useEffect(() => {
    loadStreaks();
  }, [refreshKey, loadStreaks]);

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
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
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

          <UpcomingList refresh={refreshKey} onRefresh={triggerRefresh} />
        </div>
      </div>
    </>
  );
}
