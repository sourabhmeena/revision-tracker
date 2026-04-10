"use client";

import Navigation from "../../components/Navigation";
import CalendarGrid from "../../components/CalendarGrid";
import useAuth from "../useAuth";

export default function CalendarView() {
  const isLoggedIn = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-xl dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Calendar View
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize your revision schedule in a monthly calendar
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-2 md:p-6 border border-gray-200 dark:border-gray-700">
            <CalendarGrid />
          </div>

          <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
              Navigation Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
                <span>Click on <strong>month/year</strong> to jump to any month</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
                <span>Use <strong>&larr; &rarr;</strong> buttons or arrow keys to switch months</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
                <span>Click <strong>Today</strong> button to return to current month</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
                <span>Dates with <strong>blue borders</strong> have scheduled revisions</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
                <span>Today&apos;s date has a <strong>blue ring</strong> around it</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">&bull;</span>
                <span>Click any date to view and manage topics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
