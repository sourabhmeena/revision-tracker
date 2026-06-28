"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTodayRevisions, optimisticToggleRevision, localIso } from "../hooks/useAPI";
import { staggerContainer, fadeUp, fadeUpSm, springSnappy } from "../lib/motion";
import { chipStyle } from "../lib/category";
import ProgressRing from "./ProgressRing";
import CompletionCelebration from "./CompletionCelebration";
import { CheckIcon, SparklesIcon, CheckCircleIcon } from "./icons";

const haptic = () => {
  try { navigator.vibrate?.(8); } catch {}
};

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export default function TodayWidget() {
  const { data, isLoading } = useTodayRevisions();
  const inFlight = useRef<Set<string>>(new Set());
  const [celebrate, setCelebrate] = useState(false);
  const wasAllDone = useRef<boolean | null>(null);

  const topics = data?.topics ?? [];
  const total = topics.length;
  const doneCount = topics.filter((t) => t.completed).length;
  const allDone = total > 0 && doneCount === total;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Fire the celebration only on the rising edge (not if already complete on load).
  useEffect(() => {
    if (isLoading) return;
    if (wasAllDone.current === false && allDone) setCelebrate(true);
    wasAllDone.current = allDone;
  }, [allDone, isLoading]);

  const toggle = async (revisionId: string, topicId: string, completed: boolean) => {
    if (inFlight.current.has(revisionId)) return;
    inFlight.current.add(revisionId);
    if (!completed) haptic();
    try {
      await optimisticToggleRevision({ revisionId, newCompleted: !completed, topicId, isoDate: localIso() });
    } finally {
      inFlight.current.delete(revisionId);
    }
  };

  if (isLoading) {
    return (
      <div className="rs-card p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="rs-skeleton h-3 w-20 rounded-full" />
            <div className="rs-skeleton h-6 w-44 rounded-lg" />
          </div>
          <div className="rs-skeleton w-[72px] h-[72px] rounded-full" />
        </div>
        <div className="mt-5 space-y-2.5">
          {[0, 1, 2].map((i) => <div key={i} className="rs-skeleton h-12 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <CompletionCelebration show={celebrate} onClose={() => setCelebrate(false)} />

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className={`rs-card overflow-hidden transition-colors duration-500 ${
          allDone ? "ring-1 ring-emerald-400/40" : ""
        }`}
      >
        {/* Header */}
        <div className="relative p-5 md:p-6">
          {allDone && (
            <div className="absolute inset-0 -z-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5" />
          )}
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="rs-eyebrow">Today&apos;s focus</p>
              <h2 className="rs-title text-xl md:text-2xl mt-0.5">Today&apos;s Revisions</h2>
              <p className="text-sm text-muted mt-1">{todayLabel()}</p>
            </div>
            {total > 0 && (
              <ProgressRing value={pct} size={74} id="today">
                <div className="text-center leading-none">
                  <div className="text-lg font-extrabold rs-tabular text-text">{doneCount}</div>
                  <div className="text-[10px] font-semibold text-faint -mt-0.5">of {total}</div>
                </div>
              </ProgressRing>
            )}
          </div>

          <AnimatePresence>
            {allDone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm"
              >
                <CheckCircleIcon className="text-base" /> All caught up — enjoy the rest of your day.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* List / empty state */}
        <div className="px-3 pb-3 md:px-4 md:pb-4">
          {total === 0 ? (
            <div className="grid place-items-center text-center py-10 px-6">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary-soft text-primary text-2xl mb-3">
                <SparklesIcon />
              </div>
              <p className="font-semibold text-text">Nothing due today</p>
              <p className="text-sm text-muted mt-1 max-w-xs">
                You&apos;re all caught up. Add a topic and we&apos;ll schedule its revisions for you.
              </p>
            </div>
          ) : (
            <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="space-y-1.5">
              {topics.map((t) => (
                <motion.li
                  key={t.revision_id}
                  variants={fadeUpSm}
                  layout
                  className={`group flex gap-3 p-2.5 rounded-xl transition-colors ${
                    t.completed ? "bg-surface-2/60" : "hover:bg-surface-2"
                  }`}
                >
                  <button
                    onClick={() => toggle(t.revision_id, t.topic_id, t.completed)}
                    aria-pressed={t.completed}
                    aria-label={t.completed ? `Mark ${t.title} not done` : `Mark ${t.title} done`}
                    className="shrink-0 grid place-items-center w-11 h-11 -m-1.5 rounded-full"
                  >
                    <motion.span
                      whileTap={{ scale: 0.8 }}
                      transition={springSnappy}
                      className={`grid place-items-center w-[22px] h-[22px] rounded-[7px] border-2 transition-colors ${
                        t.completed
                          ? "border-transparent text-white bg-gradient-to-br from-emerald-500 to-teal-500"
                          : "border-border-strong text-transparent group-hover:border-primary"
                      }`}
                    >
                      <AnimatePresence>
                        {t.completed && (
                          <motion.span
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={springSnappy}
                            className="grid place-items-center text-[13px]"
                          >
                            <CheckIcon strokeWidth={3.2} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.span>
                  </button>

                  <div className="min-w-0 flex-1 py-0.5">
                    <motion.div layout="position" className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={`text-sm font-semibold break-words transition-colors ${
                          t.completed ? "text-faint line-through" : "text-text"
                        }`}
                      >
                        {t.title}
                      </span>
                      {t.category && (
                        <span className="rs-chip rs-chip-dynamic" style={chipStyle(t.category)}>{t.category}</span>
                      )}
                      {t.chapter && (
                        <span className="rs-chip rs-chip-muted">{t.chapter}</span>
                      )}
                    </motion.div>
                    <AnimatePresence>
                      {t.description && !t.completed && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-muted mt-1 break-words"
                        >
                          {t.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </motion.section>
    </>
  );
}
