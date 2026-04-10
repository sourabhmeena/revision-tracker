"use client";

import { motion } from "framer-motion";
import ProgressBar from "./ProgressBar";
import TopicChecklist from "./TopicChecklist";
import type { ModalData } from "../app/types";

interface DateModalProps {
  data: ModalData | null;
  onClose: () => void;
}

export default function DateModal({ data, onClose }: DateModalProps) {
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl p-5 md:p-6 rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="text-2xl font-semibold dark:text-gray-100">{data.date || data.iso_date}</div>

        {data.progress_percent !== undefined && (
          <>
            <div className="text-gray-700 dark:text-gray-300 text-sm mt-1">
              {data.progress_percent}% of the year passed
            </div>
            <ProgressBar percent={data.progress_percent} />
          </>
        )}

        {data.topics && data.topics.length > 0 ? (
          <TopicChecklist topics={data.topics} isoDate={data.iso_date} />
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center mt-6">
            No revisions scheduled for this date.
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-900 dark:bg-gray-700 text-white rounded-xl py-2 hover:bg-black dark:hover:bg-gray-600"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
