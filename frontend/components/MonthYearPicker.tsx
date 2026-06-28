"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "./icons";

interface MonthYearPickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthYearPicker({ currentDate, onDateChange }: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const select = (month: number, year: number) => {
    onDateChange(new Date(year, month, 1));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xl md:text-2xl font-extrabold tracking-tight text-text hover:text-primary transition-colors px-2 py-1 rounded-lg"
        title="Select month and year"
      >
        {format(currentDate, "MMMM yyyy")}
        <ChevronDown className={`text-base text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 rs-card shadow-[var(--shadow-lg)] z-50 p-4 w-[19rem]"
            >
              <h4 className="rs-eyebrow mb-2">Year</h4>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => select(currentMonth, year)}
                    className={`px-2 py-2 rounded-lg text-sm font-semibold rs-tabular transition-colors ${
                      year === currentYear ? "text-on-primary bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-surface-2 text-muted hover:text-text"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <h4 className="rs-eyebrow mb-2">Month</h4>
              <div className="grid grid-cols-4 gap-1.5">
                {MONTHS.map((month, idx) => (
                  <button
                    key={month}
                    onClick={() => select(idx, currentYear)}
                    className={`px-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      idx === currentMonth ? "text-on-primary bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-surface-2 text-muted hover:text-text"
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
