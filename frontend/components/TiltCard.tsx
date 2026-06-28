"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion, useMotionValue, useSpring, useTransform, useMotionTemplate,
  type HTMLMotionProps,
} from "framer-motion";

type TiltCardProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  /** Max tilt in degrees. */
  max?: number;
  /** Pointer-tracking specular glare. */
  glare?: boolean;
};

/**
 * Glass card with interactive 3D tilt + glare on pointer move.
 * Auto-disables on touch / coarse pointers and when reduced-motion is set,
 * falling back to a plain motion.div (so it still animates entrance, etc.).
 */
export default function TiltCard({
  children, className = "", max = 7, glare = true, style, ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 18 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 220, damping: 18 });
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glareBg = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.28), transparent 45%)`;

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduce);
  }, []);

  if (!enabled) {
    return (
      <motion.div ref={ref} className={className} style={style} {...rest}>
        {children}
      </motion.div>
    );
  }

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { px.set(0.5); py.set(0.5); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`relative ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d", ...style }}
      {...rest}
    >
      {children}
      {glare && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70 mix-blend-soft-light"
          style={{ background: glareBg }}
        />
      )}
    </motion.div>
  );
}
