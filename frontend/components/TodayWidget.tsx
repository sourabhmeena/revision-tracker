"use client";

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
    <div className={`shadow-md rounded-xl p-5 md:p-6 border ${
      allDone
        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100">Today&apos;s Revisions</h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          allDone ? "bg-green-500 text-white" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
        }`}>
          {doneCount}/{topics.length}
        </span>
      </div>

      {allDone && (
        <p className="text-green-700 dark:text-green-400 font-medium text-sm mb-3">All done for today!</p>
      )}

      <ul className="space-y-3">
        {topics.map((t) => (
          <li key={t.revision_id} className="flex gap-3">
            <button
              onClick={() => toggle(t.revision_id, t.topic_id, t.completed)}
              className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                t.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-gray-300 dark:border-gray-500 hover:border-blue-500"
              }`}
            >
              {t.completed && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className={`text-sm font-medium ${t.completed ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                  {t.title}
                </span>
                {t.category && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
                    {t.category}
                  </span>
                )}
                {t.chapter && (
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                    {t.chapter}
                  </span>
                )}
              </div>
              {t.description && !t.completed && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {t.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
