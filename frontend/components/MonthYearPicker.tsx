"use client";

import { useState } from "react";
import { format } from "date-fns";

interface MonthYearPickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function MonthYearPicker({
  currentDate,
  onDateChange,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Generate years (current year ± 5 years)
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleMonthYearSelect = (month: number, year: number) => {
    const newDate = new Date(year, month, 1);
    onDateChange(newDate);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-2xl font-semibold text-gray-800 dark:text-gray-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Select month and year"
      >
        {format(currentDate, "MMMM yyyy")} ▾
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Picker Content */}
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-4 w-80">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Year
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() =>
                      handleMonthYearSelect(currentMonth, year)
                    }
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        year === currentYear
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                      }
                    `}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Month
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, idx) => (
                  <button
                    key={month}
                    onClick={() =>
                      handleMonthYearSelect(idx, currentYear)
                    }
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        idx === currentMonth
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                      }
                    `}
                  >
                    {month.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}