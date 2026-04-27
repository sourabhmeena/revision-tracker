"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { API } from "../app/api";
import ProgressBar from "./ProgressBar";
import TopicChecklist from "./TopicChecklist";
import type { ModalData } from "../app/types";

interface DateModalProps {
  data: ModalData | null;
  onClose: () => void;
}

const fetcher = (url: string) => API.get(url).then((r) => r.data as ModalData);

export default function DateModal({ data: initialData, onClose }: DateModalProps) {
  // Subscribe to the SWR cache so the checkbox state reflects the latest
  // optimistic mutations. Without this, the modal renders from a frozen
  // prop and every tap reads the same stale `completed` value, which led
  // to the "-12 of 1" bug when the API was slow and the user double-tapped.
  const { data } = useSWR<ModalData>(
    initialData ? `/revision-date/${initialData.iso_date}` : null,
    fetcher,
    {
      fallbackData: initialData ?? undefined,
      revalidateOnMount: false,
    },
  );

  if (!initialData || !data) return null;

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
