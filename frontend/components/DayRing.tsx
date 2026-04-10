import { motion } from "framer-motion";

export default function DayRing({
  day,
  done,
  total,
}: {
  day: number;
  done: number;
  total: number;
}) {
  const progress = total === 0 ? 0 : done / total;

  const ringColor =
    progress === 1 ? "#22c55e" : progress > 0 ? "#3b82f6" : "#d1d5db";

  return (
    <>
      {/* Mobile: compact version */}
      <div className="md:hidden relative flex items-center justify-center">
        <svg width={24} height={24}>
          <circle cx={12} cy={12} r={9} stroke="#e5e7eb" strokeWidth={3} fill="none" />
          <motion.circle
            cx={12} cy={12} r={9}
            stroke={ringColor} strokeWidth={3} fill="none"
            strokeDasharray={2 * Math.PI * 9}
            strokeDashoffset={2 * Math.PI * 9 - progress * 2 * Math.PI * 9}
            strokeLinecap="round"
            initial={{ strokeDashoffset: 2 * Math.PI * 9 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 9 - progress * 2 * Math.PI * 9 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute text-[10px] font-semibold">
          {progress === 1 ? "✓" : day}
        </div>
      </div>

      {/* Desktop: full version */}
      <div className="hidden md:flex relative items-center justify-center">
        <svg width={38} height={38}>
          <circle cx={19} cy={19} r={17} stroke="#e5e7eb" strokeWidth={4} fill="none" />
          <motion.circle
            cx={19} cy={19} r={17}
            stroke={ringColor} strokeWidth={4} fill="none"
            strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 - progress * 2 * Math.PI * 17}
            strokeLinecap="round"
            initial={{ strokeDashoffset: 2 * Math.PI * 17 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 17 - progress * 2 * Math.PI * 17 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute text-sm font-semibold">
          {progress === 1 ? "✓" : day}
        </div>
      </div>
    </>
  );
}
