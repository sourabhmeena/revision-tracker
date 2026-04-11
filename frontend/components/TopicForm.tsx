"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../app/api";
import { refreshAll, useTopics } from "../hooks/useAPI";

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
      className={`relative overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 transition-all duration-200 focus-within:border-violet-500 dark:focus-within:border-violet-400 ${className ?? ""}`}
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
        className="w-full px-3 md:px-4 py-2 bg-transparent focus:ring-0 outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400 relative z-10"
      />
      <AnimatePresence>
        {showPlaceholder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center pointer-events-none overflow-hidden px-3 md:px-4"
          >
            <span
              className={`text-gray-400 whitespace-nowrap ${needsMarquee ? "animate-marquee" : ""}`}
            >
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

  const addTopic = async () => {
    if (!title.trim()) {
      setError("Topic name is required");
      return;
    }
    setError("");
    setSuccess("");

    try {
      await API.post("/topics", {
        title,
        category: category.trim() || null,
        chapter: chapter.trim() || null,
        description: description.trim() || null,
      });
      setSuccess(`"${title}" added!`);
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
    }
  };

  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    topics.forEach((t) => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort();
  }, [topics]);

  const inputClass = `
    px-3 md:px-4 py-2 rounded-lg
    border border-gray-300 dark:border-gray-600
    bg-white dark:bg-gray-700
    focus:border-gray-500 dark:focus:border-gray-400 focus:ring-0 outline-none
    text-gray-800 dark:text-gray-100 placeholder:text-gray-400
  `;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Add Topic
      </h2>

      <div className="flex flex-col gap-2 md:gap-3">
        <div className="flex gap-2 md:gap-3 items-center">
          <MarqueeInput
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && !showDetails && addTopic()}
            placeholder="Topic name..."
            className="min-w-0 flex-1 basis-0"
          />
          <MarqueeInput
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !showDetails && addTopic()}
            placeholder="Category (optional)"
            list="home-category-suggestions"
            className="min-w-0 flex-1 basis-0"
          />
          <datalist id="home-category-suggestions">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button
            onClick={addTopic}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 md:px-5 py-2 md:py-3 rounded-lg font-medium transition-all shrink-0"
          >
            Add
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="self-start text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showDetails ? "\u25BE Hide details" : "\u25B8 Add details (chapter, notes)"}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex flex-col gap-2"
            >
              <input
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="Chapter (e.g. Ch. 5-7)"
                className={`w-full ${inputClass}`}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes — focus areas, page numbers, key concepts..."
                rows={3}
                className={`w-full resize-y ${inputClass}`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium"
          >
            {success}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
