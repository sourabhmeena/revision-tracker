"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../app/api";
import { refreshAll, useTopics } from "../hooks/useAPI";
import { fadeUp } from "../lib/motion";
import { PlusIcon, CheckCircleIcon, InfoIcon, ChevronDown } from "./icons";

function MarqueeInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  list,
  grow,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  list?: string;
  grow?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const measRef = useRef<HTMLSpanElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);

  const checkOverflow = useCallback(() => {
    if (!measRef.current || !wrapRef.current) return;
    const textW = measRef.current.scrollWidth;
    const boxW = wrapRef.current.clientWidth - 32;
    setNeedsMarquee(textW > boxW);
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [checkOverflow, placeholder]);

  useEffect(() => {
    if (grow && value && measRef.current) {
      const textW = measRef.current.scrollWidth;
      setInputWidth(Math.max(textW + 40, 120));
    } else if (grow) {
      setInputWidth(undefined);
    }
  }, [value, grow]);

  const showPlaceholder = !value && !focused;

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden rounded-[var(--radius-sm)] border-[1.5px] border-border-strong bg-surface dark:bg-surface-2 transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)] ${className ?? ""}`}
      style={grow && inputWidth ? { width: inputWidth, maxWidth: "100%" } : undefined}
    >
      <input
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        list={list}
        placeholder={focused ? placeholder : ""}
        className="w-full px-3.5 py-2.5 min-h-[2.875rem] bg-transparent focus:ring-0 outline-none text-text placeholder:text-faint relative z-10"
      />
      <AnimatePresence>
        {showPlaceholder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center pointer-events-none overflow-hidden px-3.5"
          >
            <span className={`text-faint whitespace-nowrap ${needsMarquee ? "animate-marquee" : ""}`}>
              <span>{placeholder}</span>
              {needsMarquee && <span className="pl-12">{placeholder}</span>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <span ref={measRef} className="absolute invisible whitespace-nowrap text-sm px-1" aria-hidden>
        {grow ? value || "x" : placeholder}
      </span>
    </div>
  );
}

export default function TopicForm() {
  const { data: topics = [] } = useTopics();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [chapter, setChapter] = useState("");
  const [description, setDescription] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addTopic = async () => {
    if (!title.trim()) {
      setError("Topic name is required");
      return;
    }
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await API.post("/topics", {
        title,
        category: category.trim() || null,
        chapter: chapter.trim() || null,
        description: description.trim() || null,
      });
      setSuccess(`"${title.trim()}" added — revisions scheduled.`);
      setTitle("");
      setCategory("");
      setChapter("");
      setDescription("");
      setShowDetails(false);
      await refreshAll();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to add topic. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    topics.forEach((t) => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort();
  }, [topics]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="rs-card p-5 md:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary-soft text-primary text-lg">
          <PlusIcon />
        </span>
        <div>
          <h2 className="rs-title text-lg md:text-xl leading-tight">Add a topic</h2>
          <p className="text-xs text-muted">We&apos;ll auto-schedule its spaced revisions.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex gap-2 md:gap-2.5 items-stretch">
          <MarqueeInput
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && !showDetails && addTopic()}
            placeholder="Topic name…"
            className="min-w-0 flex-1 basis-0"
          />
          <MarqueeInput
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !showDetails && addTopic()}
            placeholder="Category (optional)"
            list="home-category-suggestions"
            className="min-w-0 flex-1 basis-0 hidden sm:block"
          />
          <datalist id="home-category-suggestions">
            {existingCategories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <button onClick={addTopic} disabled={submitting} aria-label="Add topic" className="rs-btn rs-btn-primary shrink-0 px-4 md:px-5">
            <PlusIcon /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Category field on its own row for very small screens */}
        <MarqueeInput
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !showDetails && addTopic()}
          placeholder="Category (optional)"
          list="home-category-suggestions"
          className="sm:hidden"
        />

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="self-start inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
        >
          <ChevronDown className={`text-base transition-transform ${showDetails ? "" : "-rotate-90"}`} />
          {showDetails ? "Hide details" : "Add details (chapter, notes)"}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden flex flex-col gap-2.5"
            >
              <input
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="Chapter (e.g. Ch. 5–7)"
                className="rs-input"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes — focus areas, page numbers, key concepts…"
                rows={3}
                className="rs-input resize-y"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400"
          >
            <InfoIcon className="text-base" /> {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircleIcon className="text-base" /> {success}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
