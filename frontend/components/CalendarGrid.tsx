"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { API } from "../app/api";
import type { ModalData } from "../app/types";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import DateModal from "./DateModal";
import MonthYearPicker from "./MonthYearPicker";
import DayRing from "./DayRing";
import { useRevisions } from "../hooks/useAPI";

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
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPreviousMonth();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextMonth();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPreviousMonth, goToNextMonth]);

  const goToToday = () => {
    setDirection(0);
    setCurrentMonth(new Date());
  };

  const openModal = async (dt: Date) => {
    const iso = format(dt, "yyyy-MM-dd");
    const res = await API.get<ModalData>(`/revision-date/${iso}`);
    setModalData(res.data);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const statsByDate = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    items.forEach((item) => {
      map[item.iso_date] = { done: item.done, total: item.total };
    });
    return map;
  }, [items]);

  return (
    <div className="p-1 md:p-4">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <button
          onClick={goToPreviousMonth}
          className="text-xl px-2 md:px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold text-gray-700 dark:text-gray-200"
          title="Previous month"
        >
          &lsaquo;
        </button>

        <div className="flex items-center gap-2 md:gap-4">
          <MonthYearPicker
            currentDate={currentMonth}
            onDateChange={(newDate) => {
              setDirection(0);
              setCurrentMonth(newDate);
            }}
          />

          <button
            onClick={goToToday}
            className="px-3 md:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-xs md:text-sm"
            title="Go to today"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="text-xl px-2 md:px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold text-gray-700 dark:text-gray-200"
          title="Next month"
        >
          &rsaquo;
        </button>
      </div>

      <div className="grid grid-cols-7 text-center mb-2 md:mb-3 font-semibold text-gray-600 dark:text-gray-400 text-xs md:text-base">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="hidden md:block">{d}</div>
        ))}
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="md:hidden">{d}</div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={format(currentMonth, "yyyy-MM")}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="grid grid-cols-7 gap-1 md:gap-2"
        >
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const todayIso = format(new Date(), "yyyy-MM-dd");
            const inMonth = day.getMonth() === currentMonth.getMonth();
            const stats = statsByDate[iso];
            const isCurrentDay = isToday(day);
            const isOverdue = stats && stats.total > 0 && stats.done < stats.total && iso < todayIso;

            return (
              <div
                key={iso}
                onClick={() => openModal(day)}
                className={`
                  h-12 md:h-20 rounded-lg md:rounded-xl border cursor-pointer
                  flex items-center justify-center
                  transition-all
                  relative
                  ${
                    inMonth
                      ? isOverdue
                        ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 hover:shadow-md"
                        : "bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 hover:shadow-md"
                      : "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600"
                  }
                  ${isOverdue ? "border-red-400 dark:border-red-700 shadow-sm" : stats ? "border-blue-400 dark:border-blue-600 shadow-sm" : "border-gray-200 dark:border-gray-700"}
                  ${isCurrentDay && inMonth ? "ring-2 ring-blue-500 ring-offset-1 md:ring-offset-2" : ""}
                `}
              >
                {isCurrentDay && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                <DayRing
                  day={parseInt(format(day, "d"))}
                  done={stats?.done ?? 0}
                  total={stats?.total ?? 0}
                  overdue={!!isOverdue}
                />

                {stats && stats.total > 0 && (
                  <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 bg-gray-700 text-white text-[10px] md:text-xs font-bold px-1 md:px-1.5 py-0 md:py-0.5 rounded-md">
                    {stats.done}/{stats.total}
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <DateModal
        data={modalData}
        onClose={() => setModalData(null)}
      />
    </div>
  );
}
