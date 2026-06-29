"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mutate } from "swr";
import Navigation from "../../components/Navigation";
import ScheduleBlockModal from "../../components/ScheduleBlockModal";
import CopyDayModal from "../../components/CopyDayModal";
import useAuth from "../useAuth";
import { useSchedule, useScheduleStatus, statusKey } from "../../hooks/useAPI";
import { API } from "../api";
import type { ScheduleBlock, BlockCompletion } from "../types";
import { fadeUp, staggerContainer, springSoft } from "../../lib/motion";
import {
  WEEKDAYS, WEEKDAYS_LONG, WEEKDAY_IDS, jsWeekday, fmtTime, durationLabel, durationMins,
  isoDate, weekDates, timeBucket,
} from "../../lib/schedule";
import {
  PlusIcon, CopyIcon, ClockIcon, ChevronLeft, ChevronRight, CalendarIcon, CheckIcon,
  TrophyIcon, BoltIcon,
} from "../../components/icons";

type View = "today" | "day" | "week" | "month";
const VIEWS: View[] = ["today", "day", "week", "month"];

const refresh = () => mutate("/schedule");

export default function SchedulePage() {
  const isLoggedIn = useAuth();
  const { data: blocks = [], isLoading } = useSchedule();

  const now = new Date();
  const today = jsWeekday(now);
  const todayIso = isoDate(now);
  const wk = useMemo(() => weekDates(now), [todayIso]); // eslint-disable-line react-hooks/exhaustive-deps
  const weekStart = isoDate(wk[0]);
  const weekEnd = isoDate(wk[6]);

  const { data: status = [] } = useScheduleStatus(weekStart, weekEnd);

  const [view, setView] = useState<View>("today");
  const [selectedDay, setSelectedDay] = useState(today);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [modal, setModal] = useState<{ weekday: number; block: ScheduleBlock | null } | null>(null);
  const [copySrc, setCopySrc] = useState<number | null>(null);

  const byDay = useMemo(() => {
    const g: ScheduleBlock[][] = [[], [], [], [], [], [], []];
    for (const b of blocks) if (b.weekday >= 0 && b.weekday <= 6) g[b.weekday].push(b);
    for (const day of g) day.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return g;
  }, [blocks]);

  const weekMins = useMemo(
    () => blocks.reduce((s, b) => s + Math.max(0, durationMins(b.start_time, b.end_time)), 0),
    [blocks],
  );

  const doneSet = useMemo(() => new Set(status.map((c) => `${c.block_id}|${c.date}`)), [status]);
  const isDone = (blockId: string, dateIso: string) => doneSet.has(`${blockId}|${dateIso}`);

  const toggleDone = async (blockId: string, dateIso: string, next: boolean) => {
    const key = statusKey(weekStart, weekEnd);
    mutate(key, (cur: BlockCompletion[] = []) => {
      const others = cur.filter((c) => !(c.block_id === blockId && c.date === dateIso));
      return next ? [...others, { block_id: blockId, date: dateIso }] : others;
    }, false);
    try {
      await API.put("/schedule/completion", { block_id: blockId, date: dateIso, completed: next });
    } catch {
      mutate(key);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="w-9 h-9 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="rs-container py-6 md:py-8 max-w-5xl">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="rs-eyebrow">Planner</p>
            <h1 className="rs-title text-2xl md:text-3xl mt-1">Weekly schedule</h1>
            <p className="text-sm text-muted mt-1">
              {blocks.length} block{blocks.length === 1 ? "" : "s"} · {Math.round(weekMins / 60 * 10) / 10}h planned per week
            </p>
          </div>
          <ViewSwitch view={view} setView={setView} />
        </motion.div>

        <AnimatePresence mode="wait">
          {view === "today" && (
            <motion.div key="today" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <TodayView
                blocks={byDay[today]} todayIso={todayIso}
                isDone={isDone} onToggle={toggleDone}
                onEdit={(b) => setModal({ weekday: today, block: b })}
                onAdd={() => setModal({ weekday: today, block: null })}
                byDay={byDay} wk={wk} now={now}
              />
            </motion.div>
          )}

          {view === "day" && (
            <motion.div key="day" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <DayView
                day={selectedDay} setDay={setSelectedDay} blocks={byDay[selectedDay]}
                onAdd={() => setModal({ weekday: selectedDay, block: null })}
                onEdit={(b) => setModal({ weekday: selectedDay, block: b })}
                onCopy={() => setCopySrc(selectedDay)}
              />
            </motion.div>
          )}

          {view === "week" && (
            <motion.div key="week" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <WeekView
                byDay={byDay} today={today}
                onAdd={(d) => setModal({ weekday: d, block: null })}
                onEdit={(d, b) => setModal({ weekday: d, block: b })}
                onCopy={(d) => setCopySrc(d)}
                loading={isLoading}
              />
            </motion.div>
          )}

          {view === "month" && (
            <motion.div key="month" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }}>
              <MonthView
                cursor={monthCursor} setCursor={setMonthCursor} byDay={byDay}
                onPickDate={(wd) => { setSelectedDay(wd); setView("day"); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {modal && (
          <ScheduleBlockModal key="block-modal" weekday={modal.weekday} block={modal.block} allBlocks={blocks}
            onClose={() => setModal(null)} onSaved={refresh} />
        )}
        {copySrc !== null && (
          <CopyDayModal key="copy-modal" source={copySrc} blockCount={byDay[copySrc].length}
            onClose={() => setCopySrc(null)} onSaved={refresh} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------- View switch ---------------- */

function ViewSwitch({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <div className="inline-flex rs-card rounded-full p-1">
      {VIEWS.map((v) => {
        const active = view === v;
        return (
          <button key={v} onClick={() => setView(v)}
            className={`relative px-3.5 md:px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${active ? "text-on-primary" : "text-muted hover:text-text"}`}>
            {active && <motion.span layoutId="view-pill" transition={springSoft}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[var(--shadow-primary)]" />}
            <span className="relative">{v}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Block card (template editor) ---------------- */

function BlockCard({ block, onClick, compact = false }: { block: ScheduleBlock; onClick: () => void; compact?: boolean }) {
  const color = block.color || "#6366f1";
  return (
    <motion.button layout
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={springSoft} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className="group relative w-full text-left rounded-xl bg-surface-2/70 hover:bg-surface-2 border border-border overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: color }} />
      <div className={compact ? "py-2 pr-2.5 pl-3" : "py-2.5 pr-3 pl-3.5"}>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted rs-tabular">
          <ClockIcon className="text-xs" /> {fmtTime(block.start_time)}–{fmtTime(block.end_time)}
          <span className="text-faint">· {durationLabel(block.start_time, block.end_time)}</span>
        </div>
        <p className="font-bold text-text leading-tight mt-0.5 truncate">{block.title}</p>
        {!compact && block.description && <p className="text-xs text-muted mt-0.5 line-clamp-2">{block.description}</p>}
      </div>
    </motion.button>
  );
}

function AddBtn({ onClick, label = "Add block" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="w-full py-2 border-2 border-dashed border-border-strong rounded-xl text-muted hover:border-primary hover:text-primary transition-colors text-sm font-semibold inline-flex items-center justify-center gap-1.5">
      <PlusIcon /> {label}
    </button>
  );
}

/* ---------------- Today view (checklist) ---------------- */

function TodayView({
  blocks, todayIso, isDone, onToggle, onEdit, onAdd, byDay, wk, now,
}: {
  blocks: ScheduleBlock[]; todayIso: string;
  isDone: (id: string, d: string) => boolean;
  onToggle: (id: string, d: string, next: boolean) => void;
  onEdit: (b: ScheduleBlock) => void; onAdd: () => void;
  byDay: ScheduleBlock[][]; wk: Date[]; now: Date;
}) {
  const total = blocks.length;
  const done = blocks.filter((b) => isDone(b.id, todayIso)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const label = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-4">
      <div className="rs-card p-4 md:p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="rs-title text-lg">Today</h2>
            <p className="text-xs text-muted">{label}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-text rs-tabular leading-none">{done}<span className="text-muted text-base">/{total}</span></p>
            <p className="text-[11px] text-muted mt-0.5">{pct}% done</p>
          </div>
        </div>

        <div className="h-2 rounded-full bg-surface-2 overflow-hidden mb-4">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ...springSoft }} />
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
          <AnimatePresence mode="popLayout">
            {blocks.map((b) => {
              const checked = isDone(b.id, todayIso);
              return (
                <motion.div key={b.id} layout variants={fadeUp} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 rounded-xl bg-surface-2/60 border border-border p-2.5">
                  <button onClick={() => onToggle(b.id, todayIso, !checked)} aria-pressed={checked} aria-label={checked ? "Mark not done" : "Mark done"}
                    className={`relative grid place-items-center w-7 h-7 rounded-lg shrink-0 transition-colors ${checked ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white" : "bg-surface border-2 border-border-strong text-transparent"}`}>
                    <AnimatePresence>
                      {checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={springSoft}><CheckIcon className="text-base" /></motion.span>}
                    </AnimatePresence>
                  </button>
                  <button onClick={() => onEdit(b)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted rs-tabular">
                      <ClockIcon className="text-xs" /> {fmtTime(b.start_time)}–{fmtTime(b.end_time)}
                    </div>
                    <p className={`font-bold leading-tight truncate transition-colors ${checked ? "text-faint line-through" : "text-text"}`}>{b.title}</p>
                  </button>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color || "#6366f1" }} />
                </motion.div>
              );
            })}
          </AnimatePresence>
          {total === 0 && <p className="text-sm text-muted text-center py-6">Nothing planned today. Enjoy — or add something.</p>}
          <AddBtn onClick={onAdd} label="Add to today" />
        </motion.div>
      </div>

      <WeekReport byDay={byDay} wk={wk} now={now} isDone={isDone} />
    </div>
  );
}

/* ---------------- Weekly report ---------------- */

function WeekReport({
  byDay, wk, now, isDone,
}: {
  byDay: ScheduleBlock[][]; wk: Date[]; now: Date; isDone: (id: string, d: string) => boolean;
}) {
  const r = useMemo(() => {
    const todayMid = new Date(now); todayMid.setHours(0, 0, 0, 0);
    const buckets: Record<string, { done: number; total: number }> = {
      Morning: { done: 0, total: 0 }, Afternoon: { done: 0, total: 0 }, Evening: { done: 0, total: 0 },
    };
    const perDay = wk.map((d, i) => {
      const dIso = isoDate(d);
      const elapsed = d.getTime() <= todayMid.getTime();
      let dDone = 0;
      for (const b of byDay[i]) {
        const done = isDone(b.id, dIso);
        if (done) dDone++;
        if (elapsed) {
          const bk = buckets[timeBucket(b.start_time)];
          bk.total++; if (done) bk.done++;
        }
      }
      return { weekday: i, total: byDay[i].length, done: dDone, elapsed };
    });
    const missed: { title: string; weekday: number; time: string }[] = [];
    wk.forEach((d, i) => {
      if (d.getTime() > todayMid.getTime()) return;
      const dIso = isoDate(d);
      for (const b of byDay[i]) if (!isDone(b.id, dIso)) missed.push({ title: b.title, weekday: i, time: b.start_time });
    });
    const elapsedTotal = perDay.filter((p) => p.elapsed).reduce((s, p) => s + p.total, 0);
    const elapsedDone = perDay.filter((p) => p.elapsed).reduce((s, p) => s + p.done, 0);
    const rate = elapsedTotal ? Math.round((elapsedDone / elapsedTotal) * 100) : 0;

    const ranked = Object.entries(buckets)
      .filter(([, v]) => v.total > 0)
      .map(([k, v]) => ({ name: k, rate: Math.round((v.done / v.total) * 100), ...v }))
      .sort((a, b) => b.rate - a.rate);

    return { perDay, missed, elapsedTotal, elapsedDone, rate, buckets, best: ranked[0], worst: ranked[ranked.length - 1], ranked };
  }, [byDay, wk, now, isDone]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="rs-title text-lg inline-flex items-center gap-2"><TrophyIcon className="text-primary" /> This week</h2>
        <span className="rs-chip rs-chip-muted rs-tabular">{r.elapsedDone}/{r.elapsedTotal} done · {r.rate}%</span>
      </div>
      <p className="text-xs text-muted mb-4">How the week is going so far (past days + today).</p>

      {/* Per-day bars */}
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {r.perDay.map((p) => {
          const ratio = p.total ? p.done / p.total : 0;
          const isToday = jsWeekday(now) === p.weekday;
          return (
            <div key={p.weekday} className="flex flex-col items-center gap-1">
              <div className="relative w-full h-20 rounded-lg bg-surface-2 overflow-hidden flex items-end">
                <motion.div className={`w-full ${p.elapsed ? "bg-gradient-to-t from-indigo-500 to-violet-500" : "bg-border-strong"}`}
                  initial={{ height: 0 }} animate={{ height: `${ratio * 100}%` }} transition={springSoft} />
                {p.total > 0 && <span className="absolute inset-x-0 top-1 text-center text-[10px] font-bold text-muted rs-tabular">{p.done}/{p.total}</span>}
              </div>
              <span className={`text-[11px] font-bold ${isToday ? "text-primary" : "text-faint"}`}>{WEEKDAYS[p.weekday]}</span>
            </div>
          );
        })}
      </div>

      {/* Productivity by time of day */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {(["Morning", "Afternoon", "Evening"] as const).map((name) => {
          const v = r.buckets[name];
          const rate = v.total ? Math.round((v.done / v.total) * 100) : 0;
          const isBest = r.best?.name === name && r.best.rate > 0;
          const isWorst = r.worst?.name === name && r.ranked.length > 1 && r.worst.rate < (r.best?.rate ?? 0);
          return (
            <div key={name} className={`rounded-xl p-3 border ${isBest ? "border-emerald-400/50 bg-emerald-500/10" : isWorst ? "border-amber-400/50 bg-amber-500/10" : "border-border bg-surface-2/50"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">{name}</span>
                {isBest && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5"><BoltIcon className="text-xs" />Best</span>}
                {isWorst && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Lowest</span>}
              </div>
              <p className="text-xl font-extrabold text-text rs-tabular mt-1">{v.total ? `${rate}%` : "—"}</p>
              <p className="text-[11px] text-faint">{v.done}/{v.total} done</p>
            </div>
          );
        })}
      </div>

      {/* Not-done list */}
      <div>
        <h3 className="text-sm font-bold text-text mb-2">Not done {r.missed.length > 0 && <span className="text-muted font-normal">({r.missed.length})</span>}</h3>
        {r.missed.length === 0 ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5"><CheckIcon /> All caught up so far. Nice.</p>
        ) : (
          <div className="space-y-1.5">
            {r.missed.slice(0, 6).map((m, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" animate="show"
                className="flex items-center gap-2 text-sm rounded-lg bg-surface-2/50 px-3 py-2">
                <span className="text-xs font-bold text-faint w-9 rs-tabular">{WEEKDAYS[m.weekday]}</span>
                <span className="text-xs text-muted rs-tabular w-16">{fmtTime(m.time)}</span>
                <span className="text-text font-semibold truncate">{m.title}</span>
              </motion.div>
            ))}
            {r.missed.length > 6 && <p className="text-xs text-faint pl-3">+{r.missed.length - 6} more</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- Day view ---------------- */

function DayView({
  day, setDay, blocks, onAdd, onEdit, onCopy,
}: {
  day: number; setDay: (d: number) => void; blocks: ScheduleBlock[];
  onAdd: () => void; onEdit: (b: ScheduleBlock) => void; onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {WEEKDAYS.map((w, i) => {
          const active = day === i;
          return (
            <button key={i} onClick={() => setDay(i)}
              className={`relative flex-1 min-w-[44px] h-11 rounded-xl text-sm font-bold transition-colors ${active ? "text-on-primary" : "text-muted hover:text-text bg-surface-2"}`}>
              {active && <motion.span layoutId="dayview-pill" transition={springSoft}
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[var(--shadow-primary)]" />}
              <span className="relative">{w}</span>
            </button>
          );
        })}
      </div>

      <div className="rs-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="rs-title text-lg">{WEEKDAYS_LONG[day]}</h2>
          {blocks.length > 0 && (
            <button onClick={onCopy} className="rs-btn rs-btn-soft text-sm min-h-0 h-9"><CopyIcon /> Copy day</button>
          )}
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {blocks.map((b) => <BlockCard key={b.id} block={b} onClick={() => onEdit(b)} />)}
          </AnimatePresence>
          {blocks.length === 0 && <p className="text-sm text-muted text-center py-6">Nothing planned for {WEEKDAYS_LONG[day]} yet.</p>}
          <AddBtn onClick={onAdd} />
        </motion.div>
      </div>
    </div>
  );
}

/* ---------------- Week view ---------------- */

function WeekView({
  byDay, today, onAdd, onEdit, onCopy, loading,
}: {
  byDay: ScheduleBlock[][]; today: number;
  onAdd: (d: number) => void; onEdit: (d: number, b: ScheduleBlock) => void; onCopy: (d: number) => void;
  loading: boolean;
}) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="grid grid-cols-[repeat(7,minmax(150px,1fr))] gap-2.5 px-1">
        {WEEKDAY_IDS.map((d) => {
          const dayBlocks = byDay[d];
          const isToday = d === today;
          return (
            <motion.div key={d} variants={fadeUp} initial="hidden" animate="show"
              className={`rs-card p-2.5 flex flex-col ${isToday ? "ring-2 ring-primary/40" : ""}`}>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-extrabold ${isToday ? "text-primary" : "text-text"}`}>{WEEKDAYS[d]}</span>
                  {isToday && <span className="text-[10px] font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded-full">Today</span>}
                </div>
                {dayBlocks.length > 0 && (
                  <button onClick={() => onCopy(d)} aria-label={`Copy ${WEEKDAYS_LONG[d]}`}
                    className="grid place-items-center w-7 h-7 rounded-lg text-faint hover:text-primary hover:bg-primary-soft transition-colors">
                    <CopyIcon className="text-sm" />
                  </button>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <AnimatePresence mode="popLayout">
                  {dayBlocks.map((b) => <BlockCard key={b.id} block={b} onClick={() => onEdit(d, b)} compact />)}
                </AnimatePresence>
                {!loading && dayBlocks.length === 0 && <p className="text-[11px] text-faint text-center py-3">Empty</p>}
              </div>

              <button onClick={() => onAdd(d)} aria-label={`Add to ${WEEKDAYS_LONG[d]}`}
                className="mt-2 w-full py-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-soft transition-colors text-sm font-semibold inline-flex items-center justify-center gap-1">
                <PlusIcon className="text-sm" /> Add
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Month view ---------------- */

function MonthView({
  cursor, setCursor, byDay, onPickDate,
}: {
  cursor: Date; setCursor: (d: Date) => void; byDay: ScheduleBlock[][];
  onPickDate: (weekday: number) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayKey = new Date().toDateString();

  const first = new Date(year, month, 1);
  const lead = jsWeekday(first);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - lead + i);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const step = (delta: number) => setCursor(new Date(year, month + delta, 1));

  return (
    <div className="rs-card p-3 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="rs-title text-lg inline-flex items-center gap-2"><CalendarIcon className="text-primary" /> {monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} aria-label="Previous month" className="grid place-items-center w-9 h-9 rounded-lg bg-surface-2 text-muted hover:text-text transition-colors"><ChevronLeft /></button>
          <button onClick={() => setCursor(new Date())} className="rs-btn rs-btn-ghost text-sm min-h-0 h-9 px-3">Today</button>
          <button onClick={() => step(1)} aria-label="Next month" className="grid place-items-center w-9 h-9 rounded-lg bg-surface-2 text-muted hover:text-text transition-colors"><ChevronRight /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map((w) => <div key={w} className="text-center text-[11px] font-bold text-faint uppercase tracking-wide">{w}</div>)}
      </div>

      <motion.div key={`${year}-${month}`} variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-7 gap-1.5">
        {cells.map(({ date, inMonth }, i) => {
          const wd = jsWeekday(date);
          const dayBlocks = byDay[wd];
          const isToday = date.toDateString() === todayKey;
          return (
            <motion.button key={i} variants={fadeUp} onClick={() => onPickDate(wd)}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className={`relative aspect-square rounded-xl p-1.5 flex flex-col items-center transition-colors border ${
                isToday ? "border-primary bg-primary-soft" : "border-transparent hover:border-border bg-surface-2/50"
              } ${inMonth ? "" : "opacity-35"}`}>
              <span className={`text-xs font-bold rs-tabular ${isToday ? "text-primary" : "text-text"}`}>{date.getDate()}</span>
              {dayBlocks.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-0.5 justify-center pb-0.5">
                  {dayBlocks.slice(0, 4).map((b) => <span key={b.id} className="w-1.5 h-1.5 rounded-full" style={{ background: b.color || "#6366f1" }} />)}
                  {dayBlocks.length > 4 && <span className="text-[8px] font-bold text-faint leading-none">+{dayBlocks.length - 4}</span>}
                </div>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      <p className="text-xs text-muted mt-3 text-center">Tap any day to edit that weekday&apos;s blocks.</p>
    </div>
  );
}
