"use client";

import { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { optimisticToggleRevision } from "../hooks/useAPI";
import type { RevisionTopic } from "../app/types";
import { chipStyle } from "../lib/category";
import { springSnappy } from "../lib/motion";
import { CheckIcon } from "./icons";

interface TopicChecklistProps {
  topics: RevisionTopic[];
  isoDate: string;
}

const haptic = () => { try { navigator.vibrate?.(8); } catch {} };

export default function TopicChecklist({ topics, isoDate }: TopicChecklistProps) {
  const filtered = useMemo(() => topics.filter((t) => t.title && t.title.trim() !== ""), [topics]);
  const inFlight = useRef<Set<string>>(new Set());

  const toggle = async (item: RevisionTopic) => {
    if (inFlight.current.has(item.revision_id)) return;
    inFlight.current.add(item.revision_id);
    if (!item.completed) haptic();
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
    <div className="space-y-1.5 mt-4 max-h-[50vh] overflow-y-auto -mx-1 px-1">
      {filtered.map((item) => (
        <motion.button
          key={item.revision_id}
          layout
          onClick={() => toggle(item)}
          whileTap={{ scale: 0.99 }}
          className={`w-full text-left flex gap-3 p-2.5 rounded-xl select-none group transition-colors ${
            item.completed ? "bg-emerald-500/8" : "hover:bg-surface-2"
          }`}
        >
          <span
            className={`grid place-items-center w-[22px] h-[22px] mt-0.5 rounded-[7px] border-2 shrink-0 transition-colors ${
              item.completed
                ? "border-transparent text-white bg-gradient-to-br from-emerald-500 to-teal-500"
                : "border-border-strong text-transparent group-hover:border-primary"
            }`}
          >
            <AnimatePresence>
              {item.completed && (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                  transition={springSnappy} className="grid place-items-center text-[13px]"
                >
                  <CheckIcon strokeWidth={3.2} />
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={`text-sm font-semibold break-words transition-colors ${item.completed ? "line-through text-faint" : "text-text"}`}>
                {item.title}
              </span>
              {item.category && <span className="rs-chip rs-chip-dynamic" style={chipStyle(item.category)}>{item.category}</span>}
              {item.chapter && <span className="rs-chip rs-chip-muted">{item.chapter}</span>}
            </div>
            <AnimatePresence>
              {item.description && !item.completed && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-muted mt-1 break-words"
                >
                  {item.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
