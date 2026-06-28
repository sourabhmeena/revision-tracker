"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "../lib/motion";
import {
  getPrefs, setPrefs, requestPermission, scheduleReminder, clearScheduled,
  showTest, notificationsSupported, triggersSupported, permission,
} from "../lib/notifications";
import { BellIcon, CheckCircleIcon, InfoIcon, SparklesIcon } from "./icons";

export default function ReminderCard() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("19:00");
  const [supported, setSupported] = useState(true);
  const [triggers, setTriggers] = useState(true);
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = getPrefs();
    setEnabled(p.enabled);
    setTime(p.time);
    setSupported(notificationsSupported());
    setTriggers(triggersSupported());
    setPerm(permission());
  }, []);

  const flash = (type: "success" | "error" | "info", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const toggle = async () => {
    if (busy) return;
    if (!supported) { flash("error", "This browser doesn't support notifications."); return; }
    setBusy(true);
    try {
      if (!enabled) {
        const result = await requestPermission();
        setPerm(result);
        if (result !== "granted") {
          flash("error", result === "denied"
            ? "Notifications are blocked. Enable them in your browser settings."
            : "Permission was not granted.");
          setBusy(false);
          return;
        }
        setEnabled(true);
        setPrefs({ enabled: true, time });
        await scheduleReminder(time);
        flash("success", triggersSupported()
          ? `Daily reminder set for ${time}. It'll reach you even when the app is closed.`
          : `Daily reminder set for ${time}. It fires while the app is open on this browser.`);
      } else {
        setEnabled(false);
        setPrefs({ enabled: false, time });
        await clearScheduled();
        flash("info", "Daily reminder turned off.");
      }
    } finally {
      setBusy(false);
    }
  };

  const onTimeChange = async (value: string) => {
    setTime(value);
    setPrefs({ enabled, time: value });
    if (enabled && perm === "granted") {
      await scheduleReminder(value);
      flash("success", `Reminder time updated to ${value}.`);
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl shadow-[var(--shadow-primary)]">
            <BellIcon />
          </span>
          <div>
            <h3 className="rs-title text-lg leading-tight">Daily reminder</h3>
            <p className="text-xs text-muted">A nudge on your lock screen to keep the streak alive.</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle daily reminder"
          onClick={toggle}
          disabled={busy || !supported}
          className={`relative shrink-0 w-13 h-7 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-gradient-to-r from-indigo-500 to-violet-600" : "bg-surface-2 border border-border-strong"
          }`}
          style={{ width: "3.25rem" }}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md ${enabled ? "right-1" : "left-1"}`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-3">
              <label htmlFor="reminder-time" className="text-sm font-semibold text-text">Remind me at</label>
              <input
                id="reminder-time"
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="rs-input w-auto font-bold rs-tabular"
              />
              <button onClick={() => showTest()} className="rs-btn rs-btn-soft ml-auto text-sm min-h-0 h-10">
                <SparklesIcon /> Send test
              </button>
            </div>
            {!triggers && (
              <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-muted">
                <InfoIcon className="text-sm shrink-0 mt-0.5" />
                On this browser, reminders fire while Recall Smart is open. For lock-screen reminders when closed, install the app (Add to Home Screen) on Android/Chrome.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`mt-3 inline-flex items-center gap-1.5 text-sm ${
              msg.type === "success" ? "text-emerald-600 dark:text-emerald-400"
              : msg.type === "error" ? "text-rose-600 dark:text-rose-400" : "text-muted"
            }`}
          >
            {msg.type === "success" ? <CheckCircleIcon className="text-base" /> : <InfoIcon className="text-base" />} {msg.text}
          </motion.p>
        )}
      </AnimatePresence>

      {!supported && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
          <InfoIcon className="text-base" /> Notifications aren&apos;t supported in this browser.
        </p>
      )}
    </motion.div>
  );
}
