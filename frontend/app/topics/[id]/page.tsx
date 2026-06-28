"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import { API } from "../../api";
import Navigation from "../../../components/Navigation";
import ProgressRing from "../../../components/ProgressRing";
import useAuth from "../../useAuth";
import { optimisticToggleRevision, refreshAll, localIso } from "../../../hooks/useAPI";
import { chipStyle } from "../../../lib/category";
import { fadeUp, staggerContainer, fadeUpSm, springSnappy } from "../../../lib/motion";
import { ChevronLeft, PencilIcon, CheckIcon, CheckCircleIcon } from "../../../components/icons";

interface TopicRevision {
  id: string;
  date: string;
  date_formatted: string;
  completed: boolean;
}

interface TopicDetail {
  id: string;
  title: string;
  category: string | null;
  chapter: string | null;
  description: string | null;
  created_at: string;
  created_at_formatted: string;
  total_revisions: number;
  completed_revisions: number;
  revisions: TopicRevision[];
}

const fetcher = (url: string) => API.get(url).then((r) => r.data);
const haptic = () => { try { navigator.vibrate?.(8); } catch {} };

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isLoggedIn = useAuth();
  const { data: topic, isLoading, mutate } = useSWR<TopicDetail>(id ? `/topics/${id}` : null, fetcher);

  const [editingDetails, setEditingDetails] = useState(false);
  const [editChapter, setEditChapter] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const startEditDetails = () => {
    setEditChapter(topic?.chapter || "");
    setEditDescription(topic?.description || "");
    setEditingDetails(true);
  };

  const saveDetails = async () => {
    const ch = editChapter.trim() || null;
    const desc = editDescription.trim() || null;
    await API.patch(`/topics/${id}`, { chapter: ch ?? "", description: desc ?? "" });
    mutate((cur) => cur && { ...cur, chapter: ch, description: desc }, false);
    await refreshAll();
    setEditingDetails(false);
  };

  const inFlight = useRef<Set<string>>(new Set());

  const toggleRevision = async (revisionId: string, completed: boolean, revDate: string) => {
    if (inFlight.current.has(revisionId)) return;
    inFlight.current.add(revisionId);
    const newCompleted = !completed;
    if (newCompleted) haptic();
    const delta = newCompleted ? 1 : -1;
    mutate((cur) => cur && {
      ...cur,
      completed_revisions: Math.max(0, Math.min(cur.total_revisions, cur.completed_revisions + delta)),
      revisions: cur.revisions.map((r) => (r.id === revisionId ? { ...r, completed: newCompleted } : r)),
    }, false);
    try {
      await optimisticToggleRevision({ revisionId, newCompleted, topicId: id, isoDate: revDate });
    } finally {
      inFlight.current.delete(revisionId);
    }
  };

  if (!isLoggedIn) {
    return <div className="min-h-dvh grid place-items-center"><div className="w-9 h-9 rounded-full border-2 border-border border-t-primary animate-spin" /></div>;
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="rs-container py-6 md:py-8 max-w-3xl">
          <div className="rs-skeleton h-40 rounded-[var(--radius-lg)] mb-5" />
          <div className="rs-skeleton h-28 rounded-[var(--radius-lg)] mb-5" />
          <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="rs-skeleton h-12 rounded-xl" />)}</div>
        </main>
      </>
    );
  }

  if (!topic) {
    return (
      <>
        <Navigation />
        <main className="rs-container py-20 max-w-3xl text-center">
          <h2 className="rs-title text-xl mb-2">Topic not found</h2>
          <button onClick={() => router.push("/topics")} className="rs-btn rs-btn-soft mx-auto"><ChevronLeft /> Back to topics</button>
        </main>
      </>
    );
  }

  const progress = topic.total_revisions > 0 ? Math.round((topic.completed_revisions / topic.total_revisions) * 100) : 0;
  const todayIso = localIso();

  return (
    <>
      <Navigation />
      <main className="rs-container py-6 md:py-8 max-w-3xl">
        <button onClick={() => router.push("/topics")} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-text transition-colors mb-4">
          <ChevronLeft /> Topics
        </button>

        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5 md:p-7 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="rs-title text-2xl md:text-3xl">{topic.title}</h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {topic.category && <span className="rs-chip rs-chip-dynamic" style={chipStyle(topic.category)}>{topic.category}</span>}
                {topic.chapter && <span className="rs-chip rs-chip-muted">{topic.chapter}</span>}
              </div>
              <p className="text-sm text-muted mt-3">Created {topic.created_at_formatted}</p>
              <p className="text-sm text-muted mt-1">
                <span className="font-bold text-text rs-tabular">{topic.completed_revisions}</span> of{" "}
                <span className="font-bold text-text rs-tabular">{topic.total_revisions}</span> revisions completed
              </p>
            </div>
            <ProgressRing value={progress} size={88} stroke={8} id="topic-detail">
              <div className="text-center leading-none">
                <div className="text-xl font-extrabold rs-tabular text-text">{progress}</div>
                <div className="text-[10px] font-semibold text-faint">percent</div>
              </div>
            </ProgressRing>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5 md:p-6 mb-6">
          {editingDetails ? (
            <>
              <h3 className="rs-eyebrow mb-3">Edit details</h3>
              <input value={editChapter} onChange={(e) => setEditChapter(e.target.value)} placeholder="Chapter (e.g. Ch. 5–7)" className="rs-input mb-2.5" />
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Notes — focus areas, page numbers, key concepts…" rows={4} className="rs-input resize-y mb-3" />
              <div className="flex gap-2">
                <button onClick={saveDetails} className="rs-btn rs-btn-primary"><CheckIcon /> Save</button>
                <button onClick={() => setEditingDetails(false)} className="rs-btn rs-btn-outline">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="rs-eyebrow">Notes</h3>
                <button onClick={startEditDetails} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80"><PencilIcon className="text-sm" /> Edit</button>
              </div>
              {topic.description ? (
                <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">{topic.description}</p>
              ) : (
                <p className="text-sm text-faint italic">No notes yet. Tap Edit to add a chapter &amp; notes.</p>
              )}
            </>
          )}
        </motion.div>

        {/* Timeline */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="rs-title text-lg">Revision timeline</h2>
          <span className="text-xs text-muted rs-tabular">{topic.revisions.length} dates</span>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
          {topic.revisions.map((r) => {
            const isOverdue = !r.completed && r.date < todayIso;
            const isToday = r.date === todayIso;
            const accent = r.completed ? "border-emerald-500/30 bg-emerald-500/5"
              : isOverdue ? "border-rose-500/30 bg-rose-500/5"
              : isToday ? "border-violet-500/45 bg-violet-500/5 ring-1 ring-violet-500/20"
              : "border-border bg-surface";
            return (
              <motion.button
                key={r.id} variants={fadeUpSm} onClick={() => toggleRevision(r.id, r.completed, r.date)} whileTap={{ scale: 0.99 }}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${accent}`}
              >
                <motion.span whileTap={{ scale: 0.8 }} transition={springSnappy}
                  className={`grid place-items-center w-[22px] h-[22px] rounded-[7px] border-2 shrink-0 transition-colors ${
                    r.completed ? "border-transparent text-white bg-gradient-to-br from-emerald-500 to-teal-500" : "border-border-strong text-transparent"
                  }`}>
                  {r.completed && <span className="text-[13px]"><CheckIcon strokeWidth={3.2} /></span>}
                </motion.span>
                <span className={`flex-1 min-w-0 text-sm font-semibold ${r.completed ? "text-faint line-through" : "text-text"}`}>
                  {r.date_formatted}
                </span>
                {isToday && !r.completed && <span className="rs-chip bg-violet-500/15 text-violet-600 dark:text-violet-400">Today</span>}
                {isOverdue && <span className="rs-chip bg-rose-500/15 text-rose-600 dark:text-rose-400">Overdue</span>}
                {r.completed && <span className="rs-chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="text-xs" /> Done</span>}
              </motion.button>
            );
          })}
        </motion.div>
      </main>
    </>
  );
}
