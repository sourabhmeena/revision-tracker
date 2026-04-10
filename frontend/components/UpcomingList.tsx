"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../app/api";
import type { RevisionListItem, ModalData } from "../app/types";
import DateModal from "./DateModal";
import CompletionCelebration from "./CompletionCelebration";
import { useRevisions, localIso } from "../hooks/useAPI";

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

  const filteredList = useMemo(() => {
    switch (filter) {
      case "today":
        return list.filter((i) => i.iso_date === todayIso);
      case "overdue":
        return list.filter((i) => i.iso_date < todayIso && i.done < i.total);
      case "this_week":
        return list.filter((i) => i.iso_date >= todayIso && i.iso_date <= weekEnd);
      case "completed":
        return list.filter((i) => i.total > 0 && i.done === i.total);
      default:
        return list;
    }
  }, [list, filter, todayIso, weekEnd]);

  const openModal = async (item: RevisionListItem) => {
    const res = await API.get<ModalData>(`/revision-date/${item.iso_date}`);
    setModalData(res.data);
  };

  const handleModalClose = async () => {
    if (modalData) {
      try {
        const res = await API.get<ModalData>(`/revision-date/${modalData.iso_date}`);
        const fresh = res.data.topics;
        const allCompleted = fresh.length > 0 && fresh.every((t) => t.completed);
        if (allCompleted && modalData.iso_date !== lastCompletedDate.current) {
          setShowCelebration(true);
          lastCompletedDate.current = modalData.iso_date;
        }
      } catch {
        // If fetch fails, skip celebration check
      }
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

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        {list.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {([
                ["all", "All"],
                ["today", "Today"],
                ["overdue", "Overdue"],
                ["this_week", "This Week"],
                ["completed", "Completed"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold">{filteredList.length > 0 ? startIndex + 1 : 0}</span> to{" "}
                <span className="font-semibold">{Math.min(endIndex, filteredList.length)}</span> of{" "}
                <span className="font-semibold">{filteredList.length}</span> revision dates
              </div>
              {totalPages > 1 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {safePage} of {totalPages}
                </div>
              )}
            </div>
          </>
        )}

        <div className="space-y-4">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">{list.length === 0 ? "No upcoming revisions yet" : "No matches"}</p>
              <p className="text-sm mt-2">{list.length === 0 ? "Add topics to start your revision schedule" : "Try a different filter"}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {currentItems.map((item, i) => {
                  const percent =
                    item.total === 0 ? 0 : Math.round((item.done / item.total) * 100);
                  const isComplete = percent === 100;
                  const isOverdue = !isComplete && item.iso_date < todayIso;

                  return (
                    <motion.div
                      key={item.iso_date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-5 rounded-xl border hover:shadow-md transition-all ${
                        isComplete
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                          : isOverdue
                          ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <button
                        onClick={() => openModal(item)}
                        className="text-left w-full"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className={`text-xl font-semibold hover:underline ${isOverdue ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                            {item.date || item.iso_date}
                          </div>
                          {isComplete && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                            >
                              <span>✓</span> Complete
                            </motion.div>
                          )}
                          {isOverdue && (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {item.progress_percent}% of year passed
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">{item.done}</span> of{" "}
                            <span className="font-semibold">{item.total}</span> completed
                          </div>
                          <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {percent}%
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <motion.div
                            className={`h-3 rounded-full transition-all ${
                              isComplete ? "bg-green-500" : "bg-blue-600"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                          />
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60"
              }`}
            >
              &larr; Previous
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-3 py-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-md scale-110"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60"
              }`}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      <DateModal
        data={modalData}
        onClose={handleModalClose}
      />

      <CompletionCelebration
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
}
