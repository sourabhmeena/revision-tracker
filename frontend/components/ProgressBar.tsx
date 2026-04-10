"use client";

import { motion } from "framer-motion";

export default function ProgressBar({
  percent,
}: {
  percent: number;
}) {
  const value = Math.min(percent, 100);

  return (
    <div className="w-full mt-4">
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1 }}
          className="h-full bg-blue-600 rounded-full"
        ></motion.div>
      </div>
    </div>
  );
}
