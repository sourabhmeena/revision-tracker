"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ModalShell from "./ModalShell";
import { API } from "../app/api";
import type { ScheduleBlock } from "../app/types";
import { WEEKDAYS, WEEKDAYS_LONG, SWATCHES, DEFAULT_COLOR, durationLabel, fmtTime } from "../lib/schedule";
import { CheckIcon, TrashIcon, ClockIcon } from "./icons";

export default function ScheduleBlockModal({
  weekday, block, allBlocks, onClose, onSaved,
}: {
  weekday: number;
  block: ScheduleBlock | null; // null = create
  allBlocks: ScheduleBlock[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!block;
  const [day, setDay] = useState(block?.weekday ?? weekday);
  const [title, setTitle] = useState(block?.title ?? "");
  const [start, setStart] = useState(block?.start_time ?? "09:00");
  const [end, setEnd] = useState(block?.end_time ?? "10:00");
  const [desc, setDesc] = useState(block?.description ?? "");
  const [color, setColor] = useState(block?.color ?? DEFAULT_COLOR);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const dur = durationLabel(start, end);

  // Local overlap check for instant feedback (backend enforces it too).
  const clash = allBlocks.find(
    (b) => b.weekday === day && b.id !== block?.id && b.start_time < end && b.end_time > start,
  );

  const save = async () => {
    if (!title.trim()) { setErr("Give it a title."); return; }
    if (end <= start) { setErr("End time must be after start."); return; }
    if (clash) {
      setErr(`Overlaps “${clash.title}” (${fmtTime(clash.start_time)}–${fmtTime(clash.end_time)}) on ${WEEKDAYS_LONG[day]}.`);
      return;
    }
    setBusy(true); setErr("");
    // Send "" (not null) when cleared so the backend treats it as an explicit
    // blank and overwrites the old note — null reads as "field omitted".
    const body = { weekday: day, start_time: start, end_time: end, title: title.trim(), description: desc.trim(), color };
    try {
      if (editing) await API.patch(`/schedule/${block!.id}`, body);
      else await API.post("/schedule", body);
      onSaved();
      onClose();
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErr(detail || "Couldn't save. Try again.");
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    setBusy(true);
    try { await API.delete(`/schedule/${block!.id}`); onSaved(); onClose(); }
    catch { setErr("Couldn't delete."); setBusy(false); }
  };

  return (
    <ModalShell onClose={onClose} className="max-w-md p-5 md:p-6" labelledBy="block-modal-title">
      <div className="flex items-center justify-between mb-4">
        <h3 id="block-modal-title" className="rs-title text-lg">{editing ? "Edit block" : "New block"}</h3>
        <span className="rs-chip rs-chip-muted inline-flex items-center gap-1"><ClockIcon className="text-sm" /> {dur || "—"}</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted">Title</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="e.g. Deep work, Gym, Reading" className="rs-input mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted">Start</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rs-input mt-1 font-bold rs-tabular" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">End</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rs-input mt-1 font-bold rs-tabular" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted">Day</label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {WEEKDAYS.map((w, i) => {
              const active = day === i;
              return (
                <button key={i} onClick={() => setDay(i)}
                  className={`relative w-11 h-9 rounded-lg text-sm font-bold transition-colors ${active ? "text-on-primary" : "text-muted hover:text-text bg-surface-2"}`}>
                  {active && <motion.span layoutId="day-pick" transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600" />}
                  <span className="relative">{w}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted">Colour</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {SWATCHES.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`}
                className="grid place-items-center w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : "none" }}>
                {color === c && <CheckIcon className="text-white text-sm" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted">Notes <span className="text-faint font-normal">(optional)</span></label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
            placeholder="Anything to remember…" className="rs-input mt-1 resize-none" />
        </div>

        {clash && !err && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠ Overlaps “{clash.title}” ({fmtTime(clash.start_time)}–{fmtTime(clash.end_time)}).
          </p>
        )}
        {err && <p className="text-sm text-rose-600 dark:text-rose-400">{err}</p>}

        <div className="flex items-center gap-2 pt-1">
          {editing && (
            <button onClick={remove} disabled={busy} aria-label="Delete block"
              className="rs-btn text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 min-w-0 px-3">
              <TrashIcon />
            </button>
          )}
          <button onClick={onClose} className="rs-btn rs-btn-outline ml-auto">Cancel</button>
          <button onClick={save} disabled={busy || !!clash} className="rs-btn rs-btn-primary">
            {busy ? "Saving…" : editing ? "Save" : "Add block"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
