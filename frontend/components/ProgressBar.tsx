"use client";

import { motion } from "framer-motion";
import { easeOut } from "../lib/motion";

export default function ProgressBar({
  percent,
  complete,
}: {
  percent: number;
  complete?: boolean;
}) {
  const value = Math.max(0, Math.min(percent, 100));
  const done = complete ?? value >= 100;

  return (
    <div className="w-full">
      <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: easeOut }}
          className={`h-full rounded-full ${
            done
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
          }`}
        />
      </div>
    </div>
  );
}
