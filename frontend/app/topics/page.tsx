"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "../../components/Navigation";
import TopicScheduleEditor from "../../components/TopicScheduleEditor";
import ConfirmModal from "../../components/ConfirmModal";
import InputModal from "../../components/InputModal";
import CountUp from "../../components/CountUp";
import ProgressBar from "../../components/ProgressBar";
import TiltCard from "../../components/TiltCard";
import { API } from "../api";
import useAuth from "../useAuth";
import { useTopics, refreshAll } from "../../hooks/useAPI";
import type { TopicSummary } from "../types";
import { chipStyle } from "../../lib/category";
import { fadeUp, fadeUpSm, staggerContainer } from "../../lib/motion";
import {
  PlusIcon, SearchIcon, PencilIcon, ClockIcon, RefreshIcon, TrashIcon,
  LayersIcon, CheckCircleIcon, SparklesIcon, BookIcon, CheckIcon, XIcon, InfoIcon,
} from "../../components/icons";

type SortKey = "newest" | "alphabetical" | "most_progress" | "least_progress";

function CardAction({
  onClick, label, tone, children,
}: {
  onClick: () => void; label: string; tone: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs font-semibold transition-colors ${tone}`}
    >
      <span className="text-sm">{children}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function TopicsPage() {
  const isLoggedIn = useAuth();
  const { data: topics = [], isLoading: loading } = useTopics();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editChapter, setEditChapter] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("");
  const [newTopicChapter, setNewTopicChapter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [scheduleTopic, setScheduleTopic] = useState<TopicSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TopicSummary | null>(null);
  const [extendTarget, setExtendTarget] = useState<TopicSummary | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterChapter, setFilterChapter] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    topics.forEach((t) => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort();
  }, [topics]);

  const chapters = useMemo(() => {
    const chs = new Set<string>();
    topics.forEach((t) => { if (t.chapter) chs.add(t.chapter); });
    return Array.from(chs).sort();
  }, [topics]);

  const filteredTopics = useMemo(() => {
    let result = [...topics];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.chapter && t.chapter.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== "all") result = result.filter((t) => t.category === filterCategory);
    if (filterChapter !== "all") result = result.filter((t) => t.chapter === filterChapter);
    switch (sortBy) {
      case "alphabetical": result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "most_progress": result.sort((a, b) => b.progress_percent - a.progress_percent); break;
      case "least_progress": result.sort((a, b) => a.progress_percent - b.progress_percent); break;
      default: break;
    }
    return result;
  }, [topics, search, sortBy, filterCategory, filterChapter]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return;
    try {
      await API.post("/topics", {
        title: newTopicTitle,
        category: newTopicCategory.trim() || null,
        chapter: newTopicChapter.trim() || null,
      });
      showToast("success", `"${newTopicTitle}" added!`);
      setNewTopicTitle(""); setNewTopicCategory(""); setNewTopicChapter("");
      setShowAddForm(false);
      await refreshAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast("error", msg || "Failed to add topic");
    }
  };

  const handleUpdateTopic = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await API.patch(`/topics/${id}`, {
        title: editTitle,
        category: editCategory.trim() || "",
        chapter: editChapter.trim() || "",
        description: editDescription.trim() || "",
      });
      setEditingId(null); setEditTitle(""); setEditCategory(""); setEditChapter(""); setEditDescription("");
      await refreshAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast("error", msg || "Failed to update topic");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/topics/${deleteTarget.id}`);
      await refreshAll();
      showToast("success", `"${deleteTarget.title}" deleted`);
    } catch { showToast("error", "Failed to delete topic"); }
    setDeleteTarget(null);
  };

  const confirmExtend = async (years: string) => {
    if (!extendTarget) return;
    const n = Number(years);
    if (isNaN(n) || n <= 0) return;
    try {
      const res = await API.post(`/topics/${extendTarget.id}/extend-revisions?years=${n}`);
      showToast("success", `Added ${res.data.revisions_added} revisions for ${years} year(s)`);
      await refreshAll();
    } catch { showToast("error", "Failed to extend revisions"); }
    setExtendTarget(null);
  };

  const startEdit = (topic: TopicSummary) => {
    setEditingId(topic.id);
    setEditTitle(topic.title);
    setEditCategory(topic.category || "");
    setEditChapter(topic.chapter || "");
    setEditDescription(topic.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null); setEditTitle(""); setEditCategory(""); setEditChapter(""); setEditDescription("");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="w-9 h-9 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  const totalRevisions = topics.reduce((s, t) => s + t.total_revisions, 0);
  const completedRevisions = topics.reduce((s, t) => s + t.completed_revisions, 0);

  return (
    <>
      <Navigation />
      <main className="rs-container py-6 md:py-8">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="rs-eyebrow">Library</p>
            <h1 className="rs-title text-2xl md:text-3xl mt-1">Manage topics</h1>
            <p className="text-sm text-muted mt-1">Add, edit, schedule, or remove your learning topics.</p>
          </div>
          <button onClick={() => setShowAddForm((v) => !v)} className="rs-btn rs-btn-primary self-start sm:self-auto">
            <PlusIcon /> Add new topic
          </button>
        </motion.div>

        {/* Inline add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="rs-card p-5">
                <h3 className="rs-title text-lg mb-3">New topic</h3>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input autoFocus value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTopic()} placeholder="Topic name…"
                      className="rs-input min-w-0 flex-1" />
                    <input value={newTopicCategory} onChange={(e) => setNewTopicCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTopic()} placeholder="Category (optional)"
                      list="topics-category-suggestions" className="rs-input sm:w-44" />
                    <input value={newTopicChapter} onChange={(e) => setNewTopicChapter(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTopic()} placeholder="Chapter (optional)"
                      className="rs-input sm:w-44" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddTopic} className="rs-btn rs-btn-primary"><CheckIcon /> Add</button>
                    <button onClick={() => { setShowAddForm(false); setNewTopicTitle(""); setNewTopicCategory(""); setNewTopicChapter(""); }}
                      className="rs-btn rs-btn-outline"><XIcon /> Cancel</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        {!loading && topics.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-2.5 mb-5">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint text-lg pointer-events-none" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics…"
                className="rs-input pl-11" />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="rs-input sm:w-auto cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="alphabetical">A–Z</option>
              <option value="most_progress">Most progress</option>
              <option value="least_progress">Least progress</option>
            </select>
            {categories.length > 0 && (
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rs-input sm:w-auto cursor-pointer">
                <option value="all">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {chapters.length > 0 && (
              <select value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)} className="rs-input sm:w-auto cursor-pointer">
                <option value="all">All chapters</option>
                {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="rs-skeleton h-56 rounded-[var(--radius-lg)]" />)}
          </div>
        ) : topics.length === 0 ? (
          <div className="rs-card p-12 text-center">
            <div className="grid place-items-center w-16 h-16 mx-auto rounded-2xl bg-primary-soft text-primary text-2xl mb-4"><BookIcon /></div>
            <h3 className="rs-title text-xl mb-1">No topics yet</h3>
            <p className="text-muted mb-6">Add your first topic to start tracking revisions.</p>
            <button onClick={() => setShowAddForm(true)} className="rs-btn rs-btn-primary mx-auto"><PlusIcon /> Add your first topic</button>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="rs-card p-12 text-center text-muted">
            <SearchIcon className="text-3xl mx-auto mb-3 text-faint" />
            <p className="font-semibold text-text">No matches</p>
            <p className="text-sm mt-1">Try a different search or filter.</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {filteredTopics.map((topic) => (
              <TiltCard key={topic.id} max={6} variants={fadeUpSm} className="rs-card rs-card-hover p-5 flex flex-col h-full">
                {editingId === topic.id ? (
                  <div className="flex flex-col gap-2.5">
                    <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateTopic(topic.id)} placeholder="Topic name" className="rs-input" />
                    <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Category (optional)"
                      list="topics-category-suggestions" className="rs-input" />
                    <input value={editChapter} onChange={(e) => setEditChapter(e.target.value)} placeholder="Chapter (optional)" className="rs-input" />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Notes (optional)" rows={3} className="rs-input resize-y" />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateTopic(topic.id)} className="rs-btn rs-btn-primary flex-1"><CheckIcon /> Save</button>
                      <button onClick={cancelEdit} className="rs-btn rs-btn-outline flex-1"><XIcon /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2 mb-2">
                      <Link href={`/topics/${topic.id}`} className="rs-title text-base md:text-lg leading-snug text-text hover:text-primary transition-colors flex-1 min-w-0">
                        {topic.title}
                      </Link>
                      {topic.has_custom_schedule && (
                        <span className="rs-chip rs-chip-muted shrink-0" title="Custom schedule"><ClockIcon className="text-xs" /> Custom</span>
                      )}
                    </div>

                    {(topic.category || topic.chapter) && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {topic.category && <span className="rs-chip rs-chip-dynamic" style={chipStyle(topic.category)}>{topic.category}</span>}
                        {topic.chapter && <span className="rs-chip rs-chip-muted">{topic.chapter}</span>}
                      </div>
                    )}

                    {topic.description && <p className="text-xs text-muted line-clamp-2 mb-3">{topic.description}</p>}

                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                        <span className="rs-tabular">{topic.completed_revisions}/{topic.total_revisions} revisions</span>
                        <span className="font-bold text-text rs-tabular">{topic.progress_percent}%</span>
                      </div>
                      <ProgressBar percent={topic.progress_percent} />
                      <div className="text-[11px] text-faint mt-2">
                        Created {topic.created_at_formatted} · +{topic.intervals.join(", +")} then /{topic.repeat_interval}d
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                        <CardAction onClick={() => startEdit(topic)} label="Edit" tone="bg-surface-2 text-muted hover:text-text"><PencilIcon /></CardAction>
                        <CardAction onClick={() => setScheduleTopic(topic)} label="Schedule" tone="bg-primary-soft text-primary hover:opacity-80"><ClockIcon /></CardAction>
                        <CardAction onClick={() => setExtendTarget(topic)} label="Extend" tone="bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 hover:opacity-80"><RefreshIcon /></CardAction>
                        <CardAction onClick={() => setDeleteTarget(topic)} label="Delete" tone="bg-rose-500/12 text-rose-600 dark:text-rose-400 hover:opacity-80"><TrashIcon /></CardAction>
                      </div>
                    </div>
                  </>
                )}
              </TiltCard>
            ))}
          </motion.div>
        )}

        {/* Summary + info */}
        {topics.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <motion.div
              variants={fadeUp} initial="hidden" animate="show"
              className="md:col-span-2 relative overflow-hidden rounded-[var(--radius-xl)] p-6 text-white shadow-[var(--shadow-lg)]"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #c026d3 100%)" }}
            >
              <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/15 blur-3xl" />
              <h3 className="relative rs-eyebrow text-white/80 mb-4">Summary</h3>
              <div className="relative grid grid-cols-3 gap-4">
                {[
                  { Icon: LayersIcon, value: topics.length, label: "Topics" },
                  { Icon: SparklesIcon, value: totalRevisions, label: "Revisions" },
                  { Icon: CheckCircleIcon, value: completedRevisions, label: "Completed" },
                ].map(({ Icon, value, label }) => (
                  <div key={label}>
                    <Icon className="text-xl text-white/80 mb-1.5" />
                    <div className="text-2xl md:text-3xl font-extrabold rs-tabular"><CountUp value={value} /></div>
                    <div className="text-xs text-white/75">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5">
              <h3 className="flex items-center gap-2 rs-title text-base mb-2"><InfoIcon className="text-primary" /> Infinite revisions</h3>
              <ul className="text-xs text-muted space-y-1.5">
                <li>• Each topic auto-generates <strong className="text-text">5 years</strong> of revisions.</li>
                <li>• Default +1, +3, +7, +21, +30 then every 30 days.</li>
                <li>• Customise intervals in <strong className="text-text">Settings</strong>.</li>
                <li>• Use <strong className="text-emerald-600 dark:text-emerald-400">Extend</strong> to add more years.</li>
              </ul>
            </motion.div>
          </div>
        )}
      </main>

      {scheduleTopic && (
        <TopicScheduleEditor
          topicId={scheduleTopic.id} topicTitle={scheduleTopic.title}
          currentIntervals={scheduleTopic.intervals} currentRepeat={scheduleTopic.repeat_interval}
          hasCustom={scheduleTopic.has_custom_schedule}
          onSaved={async () => { setScheduleTopic(null); await refreshAll(); }}
          onClose={() => setScheduleTopic(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete topic"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This will also delete all associated revisions.`}
          confirmLabel="Delete" variant="danger"
          onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)}
        />
      )}

      {extendTarget && (
        <InputModal
          title="Extend revisions"
          message={`How many additional years of revisions for "${extendTarget.title}"?`}
          inputType="number" defaultValue="1" placeholder="Years" submitLabel="Extend"
          onSubmit={confirmExtend} onCancel={() => setExtendTarget(null)}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-20 md:bottom-6 right-4 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-[var(--shadow-lg)] text-sm font-semibold text-white ${
              toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {toast.type === "success" ? <CheckCircleIcon /> : <InfoIcon />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <datalist id="topics-category-suggestions">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
    </>
  );
}
