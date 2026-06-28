"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mutate } from "swr";
import { API } from "../app/api";
import type { RevisionListItem, ModalData } from "../app/types";
import DateModal from "./DateModal";
import CompletionCelebration from "./CompletionCelebration";
import { useRevisions, localIso } from "../hooks/useAPI";
import { staggerContainer, fadeUpSm, springSoft } from "../lib/motion";
import {
  CheckCircleIcon, ClockIcon, CalendarIcon, ChevronLeft, ChevronRight, InfoIcon,
} from "./icons";

const ITEMS_PER_PAGE = 10;
type FilterKey = "all" | "today" | "overdue" | "this_week" | "completed";

export default function UpcomingList() {
  const { data: list = [] } = useRevisions();
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const lastCompletedDate = useRef<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const todayIso = localIso();
  const weekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return localIso(d);
  }, []);

  // On first load (default "All" filter), jump to the page that contains
  // today — or the next upcoming date — instead of always starting at page 1.
  const didInitPage = useRef(false);
  useEffect(() => {
    if (didInitPage.current || list.length === 0) return;
    didInitPage.current = true;
    let idx = list.findIndex((i) => i.iso_date === todayIso);
    if (idx === -1) idx = list.findIndex((i) => i.iso_date > todayIso);
    if (idx === -1) idx = list.length - 1; // everything is in the past
    setCurrentPage(Math.floor(idx / ITEMS_PER_PAGE) + 1);
  }, [list, todayIso]);

  const counts = useMemo(() => ({
    all: list.length,
    today: list.filter((i) => i.iso_date === todayIso).length,
    overdue: list.filter((i) => i.iso_date < todayIso && i.done < i.total).length,
    this_week: list.filter((i) => i.iso_date >= todayIso && i.iso_date <= weekEnd).length,
    completed: list.filter((i) => i.total > 0 && i.done === i.total).length,
  }), [list, todayIso, weekEnd]);

  const filteredList = useMemo(() => {
    switch (filter) {
      case "today": return list.filter((i) => i.iso_date === todayIso);
      case "overdue": return list.filter((i) => i.iso_date < todayIso && i.done < i.total);
      case "this_week": return list.filter((i) => i.iso_date >= todayIso && i.iso_date <= weekEnd);
      case "completed": return list.filter((i) => i.total > 0 && i.done === i.total);
      default: return list;
    }
  }, [list, filter, todayIso, weekEnd]);

  const openModal = async (item: RevisionListItem) => {
    const res = await API.get<ModalData>(`/revision-date/${item.iso_date}`);
    await mutate(`/revision-date/${item.iso_date}`, res.data, false);
    setModalData(res.data);
  };

  const handleModalClose = async () => {
    if (modalData) {
      try {
        const fresh = await mutate<ModalData>(`/revision-date/${modalData.iso_date}`, undefined, { revalidate: false });
        const topics = fresh?.topics ?? [];
        const allCompleted = topics.length > 0 && topics.every((t) => t.completed);
        if (allCompleted && modalData.iso_date !== lastCompletedDate.current) {
          setShowCelebration(true);
          lastCompletedDate.current = modalData.iso_date;
        }
      } catch { /* skip */ }
    }
    setModalData(null);
  };

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredList.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const FILTERS: [FilterKey, string][] = [
    ["all", "All"], ["today", "Today"], ["overdue", "Overdue"], ["this_week", "This week"], ["completed", "Completed"],
  ];

  return (
    <>
      <div className="rs-card p-4 md:p-6">
        {list.length > 0 && (
          <>
            {/* Filter chips */}
            <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto pb-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map(([key, label]) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setFilter(key); setCurrentPage(1); }}
                    className={`relative shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      active ? "text-on-primary" : "text-muted hover:text-text bg-surface-2"
                    }`}
                  >
                    {active && (
                      <motion.span layoutId="list-filter" transition={springSoft}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" />
                    )}
                    <span className="relative">{label}</span>
                    <span className={`relative ml-1.5 text-xs rs-tabular ${active ? "text-white/80" : "text-faint"}`}>{counts[key]}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-4 flex items-center justify-between text-sm text-muted">
              <span>
                Showing <span className="font-semibold text-text rs-tabular">{filteredList.length > 0 ? startIndex + 1 : 0}</span>–
                <span className="font-semibold text-text rs-tabular">{Math.min(endIndex, filteredList.length)}</span> of{" "}
                <span className="font-semibold text-text rs-tabular">{filteredList.length}</span>
              </span>
              {totalPages > 1 && <span className="text-faint">Page {safePage}/{totalPages}</span>}
            </div>
          </>
        )}

        {filteredList.length === 0 ? (
          <div className="text-center py-14">
            <div className="grid place-items-center w-14 h-14 mx-auto rounded-2xl bg-surface-2 text-faint text-2xl mb-3">
              <CalendarIcon />
            </div>
            <p className="font-semibold text-text">{list.length === 0 ? "No upcoming revisions yet" : "No matches"}</p>
            <p className="text-sm text-muted mt-1">{list.length === 0 ? "Add topics to start your revision schedule." : "Try a different filter."}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${safePage}`}
              variants={staggerContainer} initial="hidden" animate="show" exit={{ opacity: 0, y: -8 }}
              className="grid sm:grid-cols-2 gap-3"
            >
              {currentItems.map((item) => {
                const percent = item.total === 0 ? 0 : Math.round((item.done / item.total) * 100);
                const isComplete = percent === 100;
                const isToday = item.iso_date === todayIso;
                const isOverdue = !isComplete && item.iso_date < todayIso;

                const accent = isComplete
                  ? "border-emerald-500/40"
                  : isOverdue ? "border-rose-500/40"
                  : isToday ? "border-violet-500/50" : "border-border";

                return (
                  <motion.button
                    key={item.iso_date}
                    variants={fadeUpSm}
                    onClick={() => openModal(item)}
                    whileTap={{ scale: 0.985 }}
                    className={`text-left p-4 rounded-[var(--radius-md)] border bg-surface-2/40 hover:bg-surface-2 transition-colors ${accent} ${isToday ? "ring-1 ring-violet-500/30" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-base font-bold ${isOverdue ? "text-rose-600 dark:text-rose-400" : "text-text"}`}>
                        {isToday ? "Today" : (item.date || item.iso_date)}
                      </span>
                      {isComplete ? (
                        <span className="rs-chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="text-xs" /> Done</span>
                      ) : isOverdue ? (
                        <span className="rs-chip bg-rose-500/15 text-rose-600 dark:text-rose-400"><InfoIcon className="text-xs" /> Overdue</span>
                      ) : isToday ? (
                        <span className="rs-chip bg-violet-500/15 text-violet-600 dark:text-violet-400"><ClockIcon className="text-xs" /> Today</span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted mb-2">
                      <span className="rs-tabular">{item.done}/{item.total} completed</span>
                      <span className="font-bold text-text rs-tabular">{percent}%</span>
                    </div>

                    <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isComplete ? "bg-gradient-to-r from-emerald-500 to-teal-500" : isOverdue ? "bg-gradient-to-r from-rose-500 to-orange-500" : "bg-gradient-to-r from-indigo-500 to-fuchsia-500"}`}
                        initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <div className="text-[11px] text-faint mt-2">{item.progress_percent}% of the year elapsed</div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <button onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}
              className="rs-btn rs-btn-ghost w-10 h-10 p-0 disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const show = page === 1 || page === totalPages || (page >= safePage - 1 && page <= safePage + 1);
                if (!show) {
                  if (page === safePage - 2 || page === safePage + 2) return <span key={page} className="px-2 py-2 text-faint">…</span>;
                  return null;
                }
                const active = safePage === page;
                return (
                  <button key={page} onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all rs-tabular ${
                      active ? "text-on-primary bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[var(--shadow-primary)]" : "bg-surface-2 text-muted hover:text-text"
                    }`}>
                    {page}
                  </button>
                );
              })}
            </div>
            <button onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}
              className="rs-btn rs-btn-ghost w-10 h-10 p-0 disabled:opacity-40" aria-label="Next page">
              <ChevronRight />
            </button>
          </div>
        )}
      </div>

      <DateModal data={modalData} onClose={handleModalClose} />
      <CompletionCelebration show={showCelebration} onClose={() => setShowCelebration(false)} />
    </>
  );
}
