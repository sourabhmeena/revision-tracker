"use client";

import { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { optimisticToggleRevision } from "../hooks/useAPI";
import type { RevisionTopic } from "../app/types";

interface TopicChecklistProps {
  topics: RevisionTopic[];
  isoDate: string;
}

export default function TopicChecklist({ topics, isoDate }: TopicChecklistProps) {
  const filtered = useMemo(
    () => topics.filter((t) => t.title && t.title.trim() !== ""),
    [topics],
  );

  // Per-revision in-flight lock so rapid taps during a slow API call
  // (e.g. cold-started Render) can't queue up duplicate toggles and
  // drift the optimistic counters.
  const inFlight = useRef<Set<string>>(new Set());

  const toggle = async (item: RevisionTopic) => {
    if (inFlight.current.has(item.revision_id)) return;
    inFlight.current.add(item.revision_id);
    try {
      await optimisticToggleRevision({
        revisionId: item.revision_id,
        newCompleted: !item.completed,
        topicId: item.topic_id,
        isoDate,
      });
    } catch (err) {
      console.error("Toggle error", err);
    } finally {
      inFlight.current.delete(item.revision_id);
    }
  };

  return (
    <div className="space-y-2 mt-4">
      {filtered.map((item) => (
        <motion.div
          key={item.revision_id}
          layout
          transition={{ duration: 0.2 }}
          onClick={() => toggle(item)}
          className={`flex gap-3 p-3 rounded-lg cursor-pointer select-none group transition-colors ${
            item.completed
              ? "bg-green-50 dark:bg-green-900/10"
              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }`}
        >
          <div
            className={`w-6 h-6 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
              item.completed
                ? "bg-green-500 text-white scale-110 border-green-500"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 group-hover:border-violet-400"
            }`}
          >
            <AnimatePresence>
              {item.completed && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
              <span
                className={`text-base font-medium break-words transition-colors duration-200 ${
                  item.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {item.title}
              </span>
              {item.category && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0">
                  {item.category}
                </span>
              )}
              {item.chapter && (
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0">
                  {item.chapter}
                </span>
              )}
            </div>
            <AnimatePresence>
              {item.description && !item.completed && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words"
                >
                  {item.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
