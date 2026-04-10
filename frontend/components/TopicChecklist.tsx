"use client";

import { useMemo } from "react";
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

  const toggle = async (item: RevisionTopic) => {
    try {
      await optimisticToggleRevision({
        revisionId: item.revision_id,
        newCompleted: !item.completed,
        topicId: item.topic_id,
        isoDate,
      });
    } catch (err) {
      console.error("Toggle error", err);
    }
  };

  return (
    <div className="space-y-3 mt-4">
      {filtered.map((item) => (
        <div
          key={item.revision_id}
          onClick={() => toggle(item)}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div
            className={`
              w-7 h-7 rounded-md border flex items-center justify-center
              transition-all duration-200
              ${
                item.completed
                  ? "bg-green-500 text-white scale-110 border-green-500"
                  : "bg-white dark:bg-gray-700 text-gray-400 group-hover:border-blue-400"
              }
            `}
          >
            {item.completed ? "✔" : ""}
          </div>

          <span
            className={`text-gray-700 dark:text-gray-200 text-lg transition-colors ${
              item.completed ? "line-through text-gray-400 dark:text-gray-500" : ""
            }`}
          >
            {item.title}
          </span>
        </div>
      ))}
    </div>
  );
}
