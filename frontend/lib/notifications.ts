/**
 * Daily revision reminders.
 *
 * Strategy (no backend / works on free hosting):
 *  - Where the Notification Triggers API exists (Chrome/Edge/Android), we
 *    schedule a *rolling window* of daily notifications (next 14 days) that
 *    fire on the lock screen / notification bar even when the app is closed.
 *    Each chosen time of day gets its own notification per day. Each time the
 *    app opens we top the window back up to 14 days and refresh today's body
 *    with the live task list.
 *  - Everywhere else (Safari/iOS/Firefox), a foreground timer fires the
 *    reminder while the app is open (see ReminderScheduler).
 *
 * The notification body lists the revision topics still due *today*. For
 * future days in the rolling window we can't know the tasks ahead of time, so
 * those fall back to a generic nudge — re-armed with the real list whenever the
 * app is opened on that day.
 */

import { API } from "../app/api";
import { localIso } from "../hooks/useAPI";

type TriggerCtor = new (timestamp: number) => unknown;
type GetNotifOpts = { tag?: string; includeTriggered?: boolean };

declare global {
  interface Window {
    TimestampTrigger?: TriggerCtor;
  }
}

const KEY = "rs-reminder";
const LAST_KEY = "rs-reminder-last";
const TAG_PREFIX = "rs-daily-";
const DAYS_AHEAD = 14;

export interface ReminderPrefs {
  enabled: boolean;
  times: string[]; // ["HH:MM", ...] sorted, de-duped
}

const DEFAULTS: ReminderPrefs = { enabled: false, times: ["19:00"] };

/** Normalise a list of times: drop blanks/dupes, sort ascending. */
export function normalizeTimes(times: string[]): string[] {
  const seen = new Set<string>();
  for (const t of times) {
    if (/^\d{2}:\d{2}$/.test(t)) seen.add(t);
  }
  return [...seen].sort();
}

export function getPrefs(): ReminderPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    // Migrate the old single-time shape ({ enabled, time }) → { enabled, times }.
    const times = Array.isArray(raw.times)
      ? raw.times
      : raw.time
      ? [raw.time]
      : DEFAULTS.times;
    const norm = normalizeTimes(times);
    return {
      enabled: !!raw.enabled,
      times: norm.length ? norm : DEFAULTS.times,
    };
  } catch {
    return DEFAULTS;
  }
}

export function setPrefs(p: ReminderPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    KEY,
    JSON.stringify({ enabled: p.enabled, times: normalizeTimes(p.times) }),
  );
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function triggersSupported(): boolean {
  return typeof window !== "undefined" && typeof window.TimestampTrigger === "function";
}

export function permission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "default") {
    try { return await Notification.requestPermission(); } catch { return Notification.permission; }
  }
  return Notification.permission;
}

export async function ensureSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    await navigator.serviceWorker.register("/sw.js");
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

const NOTE_TITLE = "Time to revise";
const NOTE_BODY = "Your revisions are waiting — keep your streak alive.";

const baseOptions = (extra: Record<string, unknown>): NotificationOptions =>
  ({
    body: NOTE_BODY,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/list" },
    ...extra,
  } as NotificationOptions);

interface RevisionTopicLite { title: string; completed: boolean }

/**
 * Build a title + body from today's still-pending revision topics.
 * Falls back to the generic nudge if the request fails.
 */
async function todayContent(): Promise<{ title: string; body: string }> {
  try {
    const { data } = await API.get(`/revision-date/${localIso()}`);
    const pending = (data?.topics ?? []).filter((t: RevisionTopicLite) => !t.completed);
    if (pending.length === 0) return { title: "All caught up 🎉", body: "No revisions left for today." };
    const names = pending.map((t: RevisionTopicLite) => t.title);
    const shown = names.slice(0, 5).join(", ");
    const extra = names.length > 5 ? `, +${names.length - 5} more` : "";
    const n = pending.length;
    return { title: `${n} revision${n > 1 ? "s" : ""} due today`, body: shown + extra };
  } catch {
    return { title: NOTE_TITLE, body: NOTE_BODY };
  }
}

async function pendingDaily(reg: ServiceWorkerRegistration): Promise<Notification[]> {
  try {
    const fn = reg.getNotifications as (o?: GetNotifOpts) => Promise<Notification[]>;
    const all = await fn.call(reg, { includeTriggered: true });
    return all.filter((n) => (n.tag || "").startsWith(TAG_PREFIX));
  } catch {
    return [];
  }
}

/** Cancel every scheduled daily reminder. */
export async function clearScheduled(): Promise<void> {
  const reg = await ensureSW();
  if (!reg) return;
  (await pendingDaily(reg)).forEach((n) => n.close());
}

/** (Re)schedule a rolling 14-day window of daily reminders at each `time`. */
export async function scheduleReminder(times: string[]): Promise<boolean> {
  const reg = await ensureSW();
  if (!reg || permission() !== "granted") return false;
  await clearScheduled();
  const ctor = window.TimestampTrigger;
  if (typeof ctor !== "function") return true; // foreground-only fallback

  const slots = normalizeTimes(times);
  if (!slots.length) return true;

  // Real task list for *today*; future days use the generic nudge.
  const todayIso = localIso();
  const today = await todayContent();
  const now = Date.now();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    for (const time of slots) {
      const [h, m] = time.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      d.setDate(d.getDate() + i);
      if (d.getTime() <= now) continue;
      const dayIso = localIso(d);
      const content = dayIso === todayIso ? today : { title: NOTE_TITLE, body: NOTE_BODY };
      const tag = `${TAG_PREFIX}${dayIso}-${time}`;
      try {
        await reg.showNotification(
          content.title,
          baseOptions({ tag, body: content.body, showTrigger: new ctor(d.getTime()) }),
        );
      } catch {
        /* skip a slot that fails to schedule */
      }
    }
  }
  return true;
}

/** Fire a reminder right now (used by the foreground fallback + test button). */
export async function fireNow(tag = "rs-foreground"): Promise<void> {
  const { title, body } = await todayContent();
  const reg = await ensureSW();
  if (reg) {
    await reg.showNotification(title, baseOptions({ tag, body }));
  } else if ("Notification" in window) {
    new Notification(title, { body, icon: "/icon-192.png" });
  }
}

export async function showTest(): Promise<void> {
  const { title, body } = await todayContent();
  const reg = await ensureSW();
  const opts = baseOptions({ tag: "rs-test", body });
  if (reg) await reg.showNotification(title, opts);
  else if ("Notification" in window) new Notification(title, { body });
}

// --- Foreground fallback fired-tracking (per time-slot, per day) ---

function firedState(): { date: string; slots: string[] } {
  if (typeof window === "undefined") return { date: "", slots: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_KEY) || "{}");
    if (raw.date === new Date().toDateString() && Array.isArray(raw.slots)) return raw;
  } catch { /* ignore */ }
  return { date: new Date().toDateString(), slots: [] };
}

export function markFiredSlot(time: string) {
  if (typeof window === "undefined") return;
  const s = firedState();
  if (!s.slots.includes(time)) s.slots.push(time);
  localStorage.setItem(LAST_KEY, JSON.stringify(s));
}

export function firedSlotToday(time: string): boolean {
  return firedState().slots.includes(time);
}
