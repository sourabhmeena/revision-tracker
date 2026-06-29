"use client";

import { useEffect } from "react";
import {
  getPrefs, permission, scheduleReminder, fireNow, markFiredSlot, firedSlotToday,
} from "../lib/notifications";

/**
 * Mounted once (in the root layout). When daily reminders are enabled and
 * permission is granted it:
 *   - re-arms the rolling 14-day trigger window on load + when the tab
 *     becomes visible again,
 *   - runs a foreground fallback that fires the reminder at the chosen time
 *     for browsers without the Notification Triggers API.
 */
export default function ReminderScheduler() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const arm = () => {
      const p = getPrefs();
      if (p.enabled && permission() === "granted") scheduleReminder(p.times);
    };
    arm();

    const onVisible = () => { if (document.visibilityState === "visible") arm(); };
    document.addEventListener("visibilitychange", onVisible);

    const tick = () => {
      const p = getPrefs();
      if (!p.enabled || permission() !== "granted") return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (p.times.includes(hhmm) && !firedSlotToday(hhmm)) {
        markFiredSlot(hhmm);
        fireNow();
      }
    };
    const id = window.setInterval(tick, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, []);

  return null;
}
