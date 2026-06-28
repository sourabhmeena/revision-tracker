/**
 * Daily revision reminders.
 *
 * Strategy (no backend / works on free hosting):
 *  - Where the Notification Triggers API exists (Chrome/Edge/Android), we
 *    schedule a *rolling window* of daily notifications (next 14 days) that
 *    fire on the lock screen / notification bar even when the app is closed.
 *    Each time the app opens we top the window back up to 14 days.
 *  - Everywhere else (Safari/iOS/Firefox), a foreground timer fires the
 *    reminder while the app is open (see ReminderScheduler).
 */

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
  time: string; // "HH:MM"
}

const DEFAULTS: ReminderPrefs = { enabled: false, time: "19:00" };

export function getPrefs(): ReminderPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function setPrefs(p: ReminderPrefs) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(p));
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

/** (Re)schedule a rolling 14-day window of daily reminders at `time`. */
export async function scheduleReminder(time: string): Promise<boolean> {
  const reg = await ensureSW();
  if (!reg || permission() !== "granted") return false;
  await clearScheduled();
  const ctor = window.TimestampTrigger;
  if (typeof ctor !== "function") return true; // foreground-only fallback

  const [h, m] = time.split(":").map(Number);
  const now = Date.now();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setDate(d.getDate() + i);
    if (d.getTime() <= now) continue;
    const tag = `${TAG_PREFIX}${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    try {
      await reg.showNotification(NOTE_TITLE, baseOptions({ tag, showTrigger: new ctor(d.getTime()) }));
    } catch {
      /* skip a day that fails to schedule */
    }
  }
  return true;
}

/** Fire a reminder right now (used by the foreground fallback + test button). */
export async function fireNow(tag = "rs-foreground"): Promise<void> {
  const reg = await ensureSW();
  if (reg) {
    await reg.showNotification(NOTE_TITLE, baseOptions({ tag }));
  } else if ("Notification" in window) {
    new Notification(NOTE_TITLE, { body: NOTE_BODY, icon: "/icon-192.png" });
  }
}

export async function showTest(): Promise<void> {
  const reg = await ensureSW();
  const opts = baseOptions({ tag: "rs-test", body: "This is how your daily reminder will look." });
  if (reg) await reg.showNotification("Recall Smart — test", opts);
  else if ("Notification" in window) new Notification("Recall Smart — test", { body: "This is how your daily reminder will look." });
}

export function markFiredToday() {
  if (typeof window !== "undefined") localStorage.setItem(LAST_KEY, new Date().toDateString());
}
export function firedToday(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LAST_KEY) === new Date().toDateString();
}
