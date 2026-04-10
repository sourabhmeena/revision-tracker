"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";
import TopicForm from "../components/TopicForm";
import useAuth from "./useAuth";

export default function Home() {
  const isLoggedIn = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((n) => n + 1);

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
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 md:p-8 text-white shadow-lg">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">
              Welcome to Revision Planner
            </h1>
            <p className="text-blue-100 text-sm md:text-lg">
              Master your learning with scientifically-proven spaced repetition
            </p>
          </div>

          {/* Add Topic Section */}
          <TopicForm onAdded={triggerRefresh} />

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/topics">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all cursor-pointer group">
                <div className="flex items-center gap-3 md:gap-4 mb-3">
                  <div className="text-3xl md:text-4xl">📚</div>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    Manage Topics
                  </h2>
                </div>
                <p className="text-gray-600">
                  View, edit, and delete your topics. Track progress for each subject
                </p>
                <div className="mt-4 text-blue-600 font-medium flex items-center gap-2">
                  Manage Topics
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </Link>

            <Link href="/list">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all cursor-pointer group">
                <div className="flex items-center gap-3 md:gap-4 mb-3">
                  <div className="text-3xl md:text-4xl">📋</div>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    List View
                  </h2>
                </div>
                <p className="text-gray-600">
                  View all upcoming revisions in a chronological list with progress tracking
                </p>
                <div className="mt-4 text-blue-600 font-medium flex items-center gap-2">
                  Go to List View
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </Link>

            <Link href="/calendar">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all cursor-pointer group">
                <div className="flex items-center gap-3 md:gap-4 mb-3">
                  <div className="text-3xl md:text-4xl">📅</div>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    Calendar View
                  </h2>
                </div>
                <p className="text-gray-600">
                  Visualize your revision schedule in a monthly calendar with interactive navigation
                </p>
                <div className="mt-4 text-blue-600 font-medium flex items-center gap-2">
                  Go to Calendar View
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              How Spaced Repetition Works
            </h3>
            <div className="space-y-3 text-gray-700">
              <p><strong>+1 day:</strong> First review &mdash; immediate reinforcement</p>
              <p><strong>+3 days:</strong> Short-term consolidation</p>
              <p><strong>+7 days:</strong> Weekly recall check</p>
              <p><strong>+21 days:</strong> Long-term memory transfer</p>
              <p><strong>+30 days:</strong> Monthly maintenance, then <span className="text-blue-600 font-semibold">every 30 days</span> indefinitely</p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>Infinite Revisions:</strong> Topics automatically generate
                  revisions for 5 years. Extend them anytime from the Topics page.
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Custom Schedule:</strong> Want different intervals?
                  Head to <Link href="/settings" className="underline font-semibold">Settings</Link> to
                  set your own review gaps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
