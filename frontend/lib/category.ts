import type { CSSProperties } from "react";

/**
 * Deterministic chip styling per category/chapter string.
 * Same label always maps to the same colour, giving each subject a
 * stable visual identity without storing colours in the DB.
 */

interface Palette {
  bg: string;
  fg: string;
  dark: string;
  darkFg: string;
}

const PALETTE: Palette[] = [
  { bg: "rgba(99,102,241,0.12)",  fg: "#4f46e5", dark: "rgba(129,140,248,0.18)", darkFg: "#a5b4fc" }, // indigo
  { bg: "rgba(16,185,129,0.12)",  fg: "#047857", dark: "rgba(52,211,153,0.16)",  darkFg: "#6ee7b7" }, // emerald
  { bg: "rgba(236,72,153,0.12)",  fg: "#be185d", dark: "rgba(244,114,182,0.16)", darkFg: "#f9a8d4" }, // pink
  { bg: "rgba(245,158,11,0.14)",  fg: "#b45309", dark: "rgba(251,191,36,0.16)",  darkFg: "#fcd34d" }, // amber
  { bg: "rgba(6,182,212,0.12)",   fg: "#0e7490", dark: "rgba(34,211,238,0.16)",  darkFg: "#67e8f9" }, // cyan
  { bg: "rgba(168,85,247,0.12)",  fg: "#7e22ce", dark: "rgba(192,132,252,0.18)", darkFg: "#d8b4fe" }, // purple
  { bg: "rgba(239,68,68,0.12)",   fg: "#b91c1c", dark: "rgba(248,113,113,0.16)", darkFg: "#fca5a5" }, // red
  { bg: "rgba(20,184,166,0.12)",  fg: "#0f766e", dark: "rgba(45,212,191,0.16)",  darkFg: "#5eead4" }, // teal
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function categoryColor(label: string): Palette {
  return PALETTE[hash(label.toLowerCase()) % PALETTE.length];
}

/** Inline CSS vars consumed by `.rs-chip-dynamic` (resolves per theme). */
export function chipStyle(label: string): CSSProperties {
  const c = categoryColor(label);
  const vars: Record<string, string> = {
    "--chip-bg": c.bg,
    "--chip-fg": c.fg,
    "--chip-bg-dark": c.dark,
    "--chip-fg-dark": c.darkFg,
  };
  return vars as CSSProperties;
}
