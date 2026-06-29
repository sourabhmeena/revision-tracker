"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "../lib/motion";
import {
  getPrefs, setPrefs, requestPermission, scheduleReminder, clearScheduled,
  showTest, notificationsSupported, triggersSupported, permission, normalizeTimes,
} from "../lib/notifications";
import { BellIcon, CheckCircleIcon, InfoIcon, SparklesIcon, PlusIcon, XIcon } from "./icons";

export default function ReminderCard() {
  const [enabled, setEnabled] = useState(false);
  const [times, setTimes] = useState<string[]>(["19:00"]);
  const [supported, setSupported] = useState(true);
  const [triggers, setTriggers] = useState(true);
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = getPrefs();
    setEnabled(p.enabled);
    setTimes(p.times);
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
        setPrefs({ enabled: true, times });
        await scheduleReminder(times);
        flash("success", triggersSupported()
          ? `Reminders set for ${times.join(", ")}. They'll reach you even when the app is closed.`
          : `Reminders set for ${times.join(", ")}. They fire while the app is open on this browser.`);
      } else {
        setEnabled(false);
        setPrefs({ enabled: false, times });
        await clearScheduled();
        flash("info", "Reminders turned off.");
      }
    } finally {
      setBusy(false);
    }
  };

  // Persist + reschedule whenever the list of times changes.
  const applyTimes = async (next: string[]) => {
    const norm = normalizeTimes(next);
    const list = norm.length ? norm : ["19:00"];
    setTimes(list);
    setPrefs({ enabled, times: list });
    if (enabled && perm === "granted") {
      await scheduleReminder(list);
      flash("success", `Reminder times updated: ${list.join(", ")}.`);
    }
  };

  const onTimeChange = (index: number, value: string) =>
    applyTimes(times.map((t, i) => (i === index ? value : t)));
  const addTime = () => {
    if (times.length >= 6) { flash("info", "That's plenty — max 6 reminders a day."); return; }
    // Default a new slot a few hours after the last one (wrapped to the day).
    const last = times[times.length - 1] || "19:00";
    const [h, m] = last.split(":").map(Number);
    const nh = String((h + 3) % 24).padStart(2, "0");
    applyTimes([...times, `${nh}:${String(m).padStart(2, "0")}`]);
  };
  const removeTime = (index: number) => {
    if (times.length <= 1) return;
    applyTimes(times.filter((_, i) => i !== index));
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
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between gap-3 mb-3">
                <label className="text-sm font-semibold text-text">Remind me at</label>
                <button onClick={() => showTest()} className="rs-btn rs-btn-soft text-sm min-h-0 h-10">
                  <SparklesIcon /> Send test
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {times.map((t, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 pl-2 pr-1 py-1">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => onTimeChange(i, e.target.value)}
                      className="rs-input w-auto font-bold rs-tabular bg-transparent border-0 px-1 min-h-0 h-9"
                    />
                    {times.length > 1 && (
                      <button onClick={() => removeTime(i)} aria-label="Remove reminder time"
                        className="grid place-items-center w-7 h-7 rounded-lg text-faint hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                        <XIcon />
                      </button>
                    )}
                  </div>
                ))}
                {times.length < 6 && (
                  <button onClick={addTime}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-border-strong px-3 h-11 text-sm font-semibold text-muted hover:border-primary hover:text-primary transition-colors">
                    <PlusIcon /> Add time
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">Each reminder lists the revision topics still due that day.</p>
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
