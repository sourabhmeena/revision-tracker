"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTodayRevisions, optimisticToggleRevision, localIso } from "../hooks/useAPI";

export default function TodayWidget() {
  const { data, isLoading } = useTodayRevisions();

  const toggle = async (revisionId: string, topicId: string, completed: boolean) => {
    await optimisticToggleRevision({
      revisionId,
      newCompleted: !completed,
      topicId,
      isoDate: localIso(),
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
    );
  }

  const topics = data?.topics ?? [];
  const allDone = topics.length > 0 && topics.every((t) => t.completed);
  const doneCount = topics.filter((t) => t.completed).length;

  if (topics.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 md:p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Today&apos;s Revisions</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Nothing due today. Enjoy your break!</p>
      </div>
    );
  }

  return (
    <div className={`shadow-md rounded-xl p-5 md:p-6 border transition-colors duration-300 ${
      allDone
        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100">Today&apos;s Revisions</h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${
          allDone ? "bg-green-500 text-white" : "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
        }`}>
          {doneCount}/{topics.length}
        </span>
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-green-700 dark:text-green-400 font-medium text-sm mb-3"
          >
            All done for today!
          </motion.p>
        )}
      </AnimatePresence>

      <ul className="space-y-2">
        {topics.map((t) => (
          <motion.li
            key={t.revision_id}
            layout
            transition={{ duration: 0.2 }}
            className={`flex gap-3 p-2.5 rounded-lg transition-colors ${
              t.completed
                ? "bg-gray-50 dark:bg-gray-800/50"
                : "bg-white dark:bg-gray-750 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <button
              onClick={() => toggle(t.revision_id, t.topic_id, t.completed)}
              className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                t.completed
                  ? "bg-green-500 border-green-500 text-white scale-110"
                  : "border-gray-300 dark:border-gray-500 hover:border-violet-500 hover:scale-105"
              }`}
            >
              <AnimatePresence>
                {t.completed && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </button>
            <div className="min-w-0 flex-1">
              <motion.div layout="position" className="flex flex-wrap items-start gap-x-2 gap-y-1">
                <span className={`text-sm font-medium break-words transition-colors duration-200 ${
                  t.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"
                }`}>
                  {t.title}
                </span>
                {t.category && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0">
                    {t.category}
                  </span>
                )}
                {t.chapter && (
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0">
                    {t.chapter}
                  </span>
                )}
              </motion.div>
              <AnimatePresence>
                {t.description && !t.completed && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words"
                  >
                    {t.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
