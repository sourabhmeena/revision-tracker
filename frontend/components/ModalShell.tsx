"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

export default function ModalShell({
  onClose,
  children,
  className = "max-w-sm p-6",
  labelledBy,
}: {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onClose}
      className="fixed inset-0 z-[90] grid place-items-center p-4"
      style={{ background: "rgba(8,11,24,0.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className={`rs-card shadow-[var(--shadow-lg)] w-full ${className}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
