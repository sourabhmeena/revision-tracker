"use client";

import useSWR from "swr";
import { AnimatePresence } from "framer-motion";
import { API } from "../app/api";
import ProgressBar from "./ProgressBar";
import TopicChecklist from "./TopicChecklist";
import ModalShell from "./ModalShell";
import type { ModalData } from "../app/types";
import { CalendarIcon } from "./icons";

interface DateModalProps {
  data: ModalData | null;
  onClose: () => void;
}

const fetcher = (url: string) => API.get(url).then((r) => r.data as ModalData);

export default function DateModal({ data: initialData, onClose }: DateModalProps) {
  // Subscribe to the SWR cache so checkbox state reflects the latest
  // optimistic mutations (avoids the stale-prop double-tap counter bug).
  const { data } = useSWR<ModalData>(
    initialData ? `/revision-date/${initialData.iso_date}` : null,
    fetcher,
    { fallbackData: initialData ?? undefined, revalidateOnMount: false },
  );

  return (
    <AnimatePresence>
      {initialData && data && (
        <ModalShell onClose={onClose} className="max-w-md p-5 md:p-6" labelledBy="date-title">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="rs-eyebrow flex items-center gap-1.5"><CalendarIcon className="text-sm" /> Revisions</p>
              <h3 id="date-title" className="rs-title text-xl md:text-2xl mt-0.5 truncate">{data.date || data.iso_date}</h3>
            </div>
            {data.topics && data.topics.length > 0 && (
              <span className="rs-chip rs-chip-muted shrink-0 rs-tabular">
                {data.topics.filter((t) => t.completed).length}/{data.topics.length}
              </span>
            )}
          </div>

          {data.progress_percent !== undefined && (
            <div className="mt-3">
              <div className="text-xs text-muted mb-1.5">{data.progress_percent}% of the year elapsed</div>
              <ProgressBar percent={data.progress_percent} />
            </div>
          )}

          {data.topics && data.topics.length > 0 ? (
            <TopicChecklist topics={data.topics} isoDate={data.iso_date} />
          ) : (
            <div className="text-muted text-center py-8 text-sm">No revisions scheduled for this date.</div>
          )}

          <button onClick={onClose} className="rs-btn rs-btn-outline w-full mt-5">Close</button>
        </ModalShell>
      )}
    </AnimatePresence>
  );
}
