/** Weekly-schedule helpers. Weekday index: 0=Mon … 6=Sun. */

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS_LONG = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

export const WEEKDAY_IDS = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS_ONLY = [0, 1, 2, 3, 4];
export const WEEKENDS_ONLY = [5, 6];

/** Block accent swatches (label → hex). First entry is the default. */
export const SWATCHES = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#ec4899", // pink
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#ef4444", // red
  "#14b8a6", // teal
];
export const DEFAULT_COLOR = SWATCHES[0];

/** JS Date.getDay() is Sun=0; convert to our Mon=0 scheme. */
export function jsWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Local "YYYY-MM-DD" (no UTC shift). */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The 7 dates (Mon→Sun) of the week containing `ref`. */
export function weekDates(ref: Date = new Date()): Date[] {
  const monday = new Date(ref);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(ref.getDate() - jsWeekday(ref));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Coarse part-of-day bucket from an "HH:MM" start time. */
export function timeBucket(start: string): "Morning" | "Afternoon" | "Evening" {
  const h = Number(start.split(":")[0]);
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

/** "13:30" → "1:30 PM" */
export function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ap}`;
}

/** Minutes between two "HH:MM" strings (end assumed after start). */
export function durationMins(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function durationLabel(start: string, end: string): string {
  const mins = durationMins(start, end);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ");
}
