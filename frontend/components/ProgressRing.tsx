"use client";

import { motion } from "framer-motion";
import { easeOut } from "../lib/motion";

interface Props {
  value: number;          // 0–100
  size?: number;          // px
  stroke?: number;        // px
  children?: React.ReactNode;
  /** Gradient id suffix to keep multiple rings unique on a page. */
  id?: string;
  className?: string;
  trackClassName?: string;
}

export default function ProgressRing({
  value,
  size = 72,
  stroke = 7,
  children,
  id = "ring",
  className = "",
  trackClassName = "",
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const gid = `pr-${id}`;

  return (
    <div className={`relative grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--grad-1)" />
            <stop offset="55%" stopColor="var(--grad-2)" />
            <stop offset="100%" stopColor="var(--grad-3)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={`stroke-surface-2 ${trackClassName}`}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (clamped / 100) * c }}
          transition={{ duration: 0.9, ease: easeOut }}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 grid place-items-center">{children}</div>
      )}
    </div>
  );
}
