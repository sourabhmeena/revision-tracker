"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { TrophyIcon, SparklesIcon } from "./icons";

interface CompletionCelebrationProps {
  show: boolean;
  onClose: () => void;
}

const CONFETTI_COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#f59e0b", "#10b981", "#22d3ee"];

export default function CompletionCelebration({ show, onClose }: CompletionCelebrationProps) {
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; rotation: number; duration: number; delay: number; color: string; size: number }>
  >([]);

  useEffect(() => {
    if (!show) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      setConfetti(
        Array.from({ length: 60 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          rotation: Math.random() * 360,
          duration: 2.2 + Math.random() * 1.8,
          delay: Math.random() * 0.4,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 7 + Math.random() * 7,
        }))
      );
    }
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center p-4"
            style={{ background: "rgba(8,11,24,0.55)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.7, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="rs-card w-full max-w-sm text-center p-7 shadow-[var(--shadow-lg)]"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                className="mx-auto mb-5 grid place-items-center w-20 h-20 rounded-2xl text-white text-4xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-[var(--shadow-streak)]"
              >
                <motion.span
                  animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.4 }}
                  className="grid place-items-center"
                >
                  <TrophyIcon />
                </motion.span>
              </motion.div>

              <motion.h2
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-extrabold tracking-tight text-text mb-1"
              >
                All done for today!
              </motion.h2>
              <motion.p
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="text-muted text-sm mb-6"
              >
                Every revision ticked off. Your memory thanks you.
              </motion.p>

              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.36 }}
                className="rounded-xl p-4 text-white bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                <div className="text-3xl font-extrabold rs-tabular">100%</div>
                <div className="text-xs font-medium opacity-90">Daily goal achieved</div>
              </motion.div>

              <motion.button
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.44 }}
                onClick={onClose}
                className="rs-btn rs-btn-primary w-full mt-5"
              >
                <SparklesIcon /> Keep the streak alive
              </motion.button>
            </motion.div>
          </motion.div>

          <div className="fixed inset-0 pointer-events-none z-[101] overflow-hidden">
            {confetti.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: `${p.x}vw`, y: "-10vh", rotate: p.rotation, opacity: 1 }}
                animate={{ y: "110vh", rotate: p.rotation + 720, opacity: [1, 1, 0.9, 0] }}
                transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
                className="absolute rounded-sm"
                style={{ width: p.size, height: p.size * 0.6, background: p.color }}
              />
            ))}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
