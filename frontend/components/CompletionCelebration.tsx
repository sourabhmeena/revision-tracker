"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface CompletionCelebrationProps {
  show: boolean;
  onClose: () => void;
}

export default function CompletionCelebration({
  show,
  onClose,
}: CompletionCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; rotation: number; duration: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces with pre-computed random values
      const colors = [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#FFA07A",
        "#98D8C8",
        "#F7DC6F",
      ];
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setConfetti(pieces);

      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Celebration Card */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-md text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Trophy Animation */}
              <motion.div
                className="text-8xl mb-4"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              >
                🎉
              </motion.div>

              {/* Success Message */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-gray-800 mb-2"
              >
                Amazing Work!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mb-6"
              >
                You&apos;ve completed all revisions for today! 🚀
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white"
              >
                <div className="text-4xl font-bold mb-1">100%</div>
                <div className="text-sm">Daily Goal Achieved!</div>
              </motion.div>

              {/* Close Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onClose}
                className="mt-6 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
              >
                Continue Learning! ✨
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Confetti */}
          <div className="fixed inset-0 pointer-events-none z-50">
            {confetti.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{
                  x: `${piece.x}vw`,
                  y: "-10vh",
                  rotate: piece.rotation,
                }}
                animate={{
                  y: "110vh",
                  rotate: piece.rotation + 720,
                }}
                transition={{
                  duration: piece.duration,
                  ease: "linear",
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: piece.color,
                }}
              />
            ))}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}