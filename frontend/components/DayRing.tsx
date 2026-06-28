import { motion } from "framer-motion";

export default function DayRing({
  day,
  done,
  total,
  overdue = false,
}: {
  day: number;
  done: number;
  total: number;
  overdue?: boolean;
}) {
  const progress = total === 0 ? 0 : done / total;
  const complete = progress >= 1;

  const ringColor = overdue
    ? "#f43f5e"
    : complete
    ? "#10b981"
    : progress > 0
    ? "#8b5cf6"
    : "transparent";

  const Ring = ({ size, r, sw }: { size: number; r: number; sw: number }) => {
    const c = 2 * Math.PI * r;
    return (
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none" style={{ stroke: "var(--border-strong)" }} />
        {progress > 0 && (
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} stroke={ringColor} strokeWidth={sw} fill="none"
            strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - progress * c }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </svg>
    );
  };

  const label = (
    <span className={`absolute font-bold ${overdue ? "text-rose-500" : complete ? "text-emerald-500" : "text-text"}`}>
      {complete ? "✓" : day}
    </span>
  );

  return (
    <>
      <div className="md:hidden relative grid place-items-center text-[11px]">
        <Ring size={26} r={10} sw={3} />
        {label}
      </div>
      <div className="hidden md:grid relative place-items-center text-sm">
        <Ring size={40} r={17} sw={4} />
        {label}
      </div>
    </>
  );
}
