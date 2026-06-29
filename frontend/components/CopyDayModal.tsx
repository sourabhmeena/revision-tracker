"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ModalShell from "./ModalShell";
import { API } from "../app/api";
import { WEEKDAYS, WEEKDAYS_LONG, WEEKDAYS_ONLY, WEEKENDS_ONLY, WEEKDAY_IDS } from "../lib/schedule";
import { CheckIcon, CopyIcon } from "./icons";

export default function CopyDayModal({
  source, blockCount, onClose, onSaved,
}: {
  source: number;        // weekday to copy from
  blockCount: number;    // # of blocks on the source day
  onClose: () => void;
  onSaved: () => void;
}) {
  const [targets, setTargets] = useState<Set<number>>(new Set());
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const selectable = WEEKDAY_IDS.filter((d) => d !== source);
  const toggle = (d: number) =>
    setTargets((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  const pick = (days: number[]) =>
    setTargets(new Set(days.filter((d) => d !== source)));

  const apply = async () => {
    if (targets.size === 0) { setErr("Pick at least one day."); return; }
    setBusy(true); setErr("");
    try {
      await API.post("/schedule/copy", { source, targets: [...targets], replace });
      onSaved();
      onClose();
    } catch {
      setErr("Couldn't copy. Try again.");
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} className="max-w-md p-5 md:p-6" labelledBy="copy-modal-title">
      <h3 id="copy-modal-title" className="rs-title text-lg inline-flex items-center gap-2">
        <CopyIcon /> Copy {WEEKDAYS_LONG[source]}
      </h3>
      <p className="text-sm text-muted mt-1">
        {blockCount} block{blockCount === 1 ? "" : "s"} → choose where to paste.
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => pick(WEEKDAYS_ONLY)} className="rs-btn rs-btn-soft text-sm min-h-0 h-9">Weekdays</button>
        <button onClick={() => pick(WEEKENDS_ONLY)} className="rs-btn rs-btn-soft text-sm min-h-0 h-9">Weekends</button>
        <button onClick={() => pick(WEEKDAY_IDS)} className="rs-btn rs-btn-soft text-sm min-h-0 h-9">All others</button>
        <button onClick={() => setTargets(new Set())} className="rs-btn rs-btn-ghost text-sm min-h-0 h-9 ml-auto">Clear</button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {selectable.map((d) => {
          const on = targets.has(d);
          return (
            <button key={d} onClick={() => toggle(d)}
              className={`relative h-11 rounded-xl text-sm font-bold transition-colors ${on ? "text-on-primary" : "text-muted hover:text-text bg-surface-2"}`}>
              {on && <motion.span layoutId={`copy-${d}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600" />}
              <span className="relative inline-flex items-center gap-1">
                {on && <CheckIcon className="text-sm" />}{WEEKDAYS[d]}
              </span>
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-3 mt-4 cursor-pointer">
        <button role="switch" aria-checked={replace} onClick={() => setReplace((v) => !v)}
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${replace ? "bg-gradient-to-r from-indigo-500 to-violet-600" : "bg-surface-2 border border-border-strong"}`}>
          <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md ${replace ? "right-1" : "left-1"}`} />
        </button>
        <span className="text-sm text-text">
          <strong>{replace ? "Replace" : "Add to"}</strong> existing blocks on those days
        </span>
      </label>

      {err && <p className="text-sm text-rose-600 dark:text-rose-400 mt-3">{err}</p>}

      <div className="flex items-center gap-2 mt-5">
        <button onClick={onClose} className="rs-btn rs-btn-outline ml-auto">Cancel</button>
        <button onClick={apply} disabled={busy} className="rs-btn rs-btn-primary">
          {busy ? "Copying…" : `Copy to ${targets.size || ""} day${targets.size === 1 ? "" : "s"}`}
        </button>
      </div>
    </ModalShell>
  );
}
