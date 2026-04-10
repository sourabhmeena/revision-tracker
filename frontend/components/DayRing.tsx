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
  const size = 38;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = total === 0 ? 0 : done / total;
  const offset = circumference - progress * circumference;

  // Colors
  const ringColor =
    progress === 1 ? "#22c55e" : progress > 0 ? "#3b82f6" : "#d1d5db";

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Ring */}
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>

      {/* Text or Checkmark */}
      <div className="absolute text-sm font-semibold">
        {progress === 1 ? "✓" : day}
      </div>
    </div>
  );
}
