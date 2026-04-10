"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../app/api";
import type { RevisionListItem, ModalData } from "../app/types";
import DateModal from "./DateModal";
import CompletionCelebration from "./CompletionCelebration";

const ITEMS_PER_PAGE = 10;

interface UpcomingListProps {
  refresh: number;
  onRefresh: () => void;
}

export default function UpcomingList({ refresh, onRefresh }: UpcomingListProps) {
  const [list, setList] = useState<RevisionListItem[]>([]);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await API.get<RevisionListItem[]>("/revisions");
    setList(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [refresh, load]);

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
        if (allCompleted && modalData.iso_date !== lastCompletedDate) {
          setShowCelebration(true);
          setLastCompletedDate(modalData.iso_date);
        }
      } catch {
        // If fetch fails, skip celebration check
      }
    }
    setModalData(null);
  };

  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = list.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        {list.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
              <span className="font-semibold">{Math.min(endIndex, list.length)}</span> of{" "}
              <span className="font-semibold">{list.length}</span> revision dates
            </div>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {list.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No upcoming revisions yet</p>
              <p className="text-sm mt-2">Add topics to start your revision schedule</p>
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

                  return (
                    <motion.div
                      key={item.iso_date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`bg-gray-50 p-5 rounded-xl border hover:shadow-md transition-all ${
                        isComplete
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <button
                        onClick={() => openModal(item)}
                        className="text-left w-full"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xl font-semibold text-blue-600 hover:underline">
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
                        </div>

                        <div className="text-sm text-gray-500 mb-3">
                          {item.progress_percent}% of year passed
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">{item.done}</span> of{" "}
                            <span className="font-semibold">{item.total}</span> completed
                          </div>
                          <div className="text-sm font-bold text-gray-700">
                            {percent}%
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
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
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
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
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
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
        refresh={onRefresh}
      />

      <CompletionCelebration
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
}
