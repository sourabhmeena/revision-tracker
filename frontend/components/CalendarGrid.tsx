"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { mutate } from "swr";
import { API } from "../app/api";
import type { ModalData } from "../app/types";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import DateModal from "./DateModal";
import MonthYearPicker from "./MonthYearPicker";
import DayRing from "./DayRing";
import { useRevisions } from "../hooks/useAPI";
import { ChevronLeft, ChevronRight } from "./icons";

export default function CalendarGrid() {
  const { data: items = [] } = useRevisions();
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const goToPreviousMonth = useCallback(() => {
    setDirection(-1);
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setDirection(1);
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goToPreviousMonth(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goToNextMonth(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPreviousMonth, goToNextMonth]);

  const goToToday = () => { setDirection(0); setCurrentMonth(new Date()); };

  const openModal = async (dt: Date) => {
    const iso = format(dt, "yyyy-MM-dd");
    const res = await API.get<ModalData>(`/revision-date/${iso}`);
    await mutate(`/revision-date/${iso}`, res.data, false);
    setModalData(res.data);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const todayIso = format(new Date(), "yyyy-MM-dd");

  const statsByDate = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    items.forEach((item) => { map[item.iso_date] = { done: item.done, total: item.total }; });
    return map;
  }, [items]);

  return (
    <div className="p-1 md:p-2">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <button onClick={goToPreviousMonth} aria-label="Previous month" className="rs-btn rs-btn-ghost w-10 h-10 p-0 text-lg">
          <ChevronLeft />
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          <MonthYearPicker currentDate={currentMonth} onDateChange={(d) => { setDirection(0); setCurrentMonth(d); }} />
          <button onClick={goToToday} className="rs-btn rs-btn-soft px-3.5 py-2 text-sm min-h-0 h-9">Today</button>
        </div>

        <button onClick={goToNextMonth} aria-label="Next month" className="rs-btn rs-btn-ghost w-10 h-10 p-0 text-lg">
          <ChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center mb-2 md:mb-3 font-semibold text-faint text-xs md:text-sm uppercase tracking-wide">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="hidden md:block">{d}</div>)}
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} className="md:hidden">{d}</div>)}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={format(currentMonth, "yyyy-MM")}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-7 gap-1 md:gap-2"
        >
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const inMonth = day.getMonth() === currentMonth.getMonth();
            const stats = statsByDate[iso];
            const scheduled = stats && stats.total > 0;
            const complete = scheduled && stats.done >= stats.total;
            const isCurrentDay = iso === todayIso;
            const isOverdue = scheduled && stats.done < stats.total && iso < todayIso;

            const border = isOverdue
              ? "border-rose-500/45"
              : complete ? "border-emerald-500/40"
              : scheduled ? "border-violet-500/45" : "border-border";

            return (
              <button
                key={iso}
                onClick={() => openModal(day)}
                className={`relative grid place-items-center h-12 md:h-20 rounded-lg md:rounded-xl border transition-all
                  ${inMonth ? "bg-surface hover:bg-surface-2 hover:shadow-[var(--shadow-sm)]" : "bg-transparent border-transparent opacity-50"}
                  ${inMonth ? border : ""}
                  ${isOverdue && inMonth ? "bg-rose-500/5" : ""}
                  ${isCurrentDay && inMonth ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-[var(--surface)]" : ""}
                `}
              >
                {isCurrentDay && inMonth && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-500 rounded-full" />
                )}
                <DayRing day={parseInt(format(day, "d"))} done={stats?.done ?? 0} total={stats?.total ?? 0} overdue={!!isOverdue} />
                {scheduled && (
                  <span className={`absolute bottom-0.5 md:bottom-1 text-[9px] md:text-[10px] font-bold rs-tabular px-1 rounded ${
                    complete ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/12"
                    : isOverdue ? "text-rose-600 dark:text-rose-400 bg-rose-500/12"
                    : "text-violet-600 dark:text-violet-400 bg-violet-500/12"
                  }`}>
                    {stats.done}/{stats.total}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <DateModal data={modalData} onClose={() => setModalData(null)} />
    </div>
  );
}
