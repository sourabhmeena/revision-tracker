"use client";

import { useState, useEffect } from "react";
import { optimisticToggleRevision } from "../hooks/useAPI";
import type { RevisionTopic } from "../app/types";

interface TopicChecklistProps {
  topics: RevisionTopic[];
  isoDate: string;
}

export default function TopicChecklist({ topics, isoDate }: TopicChecklistProps) {
  const [localTopics, setLocalTopics] = useState<RevisionTopic[]>([]);

  useEffect(() => {
    setLocalTopics(topics.filter((t) => t.title && t.title.trim() !== ""));
  }, [topics]);

  const toggle = async (item: RevisionTopic, index: number) => {
    const updated = !item.completed;

    setLocalTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, completed: updated } : t))
    );

    try {
      await optimisticToggleRevision({
        revisionId: item.revision_id,
        newCompleted: updated,
        topicId: item.topic_id,
        isoDate,
      });
    } catch (err) {
      setLocalTopics((prev) =>
        prev.map((t, i) => (i === index ? { ...t, completed: !updated } : t))
      );
      console.error("Toggle error", err);
    }
  };

  return (
    <div className="space-y-3 mt-4">
      {localTopics.map((item, i) => (
        <div
          key={item.revision_id}
          onClick={() => toggle(item, i)}
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
