"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useDarkMode from "../hooks/useDarkMode";
import { springSoft } from "../lib/motion";
import {
  HomeIcon, BookIcon, ListIcon, CalendarIcon, SettingsIcon, SunIcon, MoonIcon, LayersIcon,
} from "./icons";

const navItems = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/topics", label: "Topics", Icon: BookIcon },
  { href: "/list", label: "List", Icon: ListIcon },
  { href: "/schedule", label: "Schedule", Icon: LayersIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

/** Gentle idle bob so each bubble feels like it's floating in the sky. */
function Float({ i, children, className = "" }: { i: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 3.6 + (i % 4) * 0.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.35,
      }}
    >
      {children}
    </motion.div>
  );
}

function DarkToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rs-card rs-card-hover grid place-items-center w-12 h-12 rounded-full text-xl"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25 }}
          className="grid place-items-center"
        >
          {dark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`rs-card rs-card-hover group inline-flex items-center gap-2.5 rounded-full ${
        compact ? "pl-1.5 pr-3.5 h-11" : "pl-2 pr-4 h-12"
      }`}
    >
      <span className="relative inline-grid place-items-center">
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 blur-[6px] opacity-50 group-hover:opacity-70 transition-opacity" />
        <Image
          src="/logo.png"
          alt="Recall Smart"
          width={compact ? 28 : 32}
          height={compact ? 28 : 32}
          className="relative rounded-xl ring-1 ring-black/5"
        />
      </span>
      <span className={`font-extrabold tracking-tight text-text ${compact ? "text-base" : "text-base"}`}>
        Recall <span className="rs-gradient-text">Smart</span>
      </span>
    </Link>
  );
}

/** A single circular floating nav bubble (icon only, label as tooltip). */
function NavBubble({
  href, label, Icon, active, layoutId, size = "w-12 h-12", iconClass = "text-lg",
}: {
  href: string; label: string; Icon: React.ComponentType; active: boolean;
  layoutId: string; size?: string; iconClass?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`relative grid place-items-center ${size} rounded-full rs-card rs-card-hover ${
        active ? "" : "text-muted hover:text-text"
      }`}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          transition={springSoft}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[var(--shadow-primary)]"
        />
      )}
      <motion.span
        animate={{ scale: active ? 1.08 : 1 }}
        transition={springSoft}
        className={`relative ${iconClass} ${active ? "text-on-primary" : ""}`}
      >
        <Icon />
      </motion.span>
    </Link>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { dark, toggle: toggleDark } = useDarkMode();

  return (
    <>
      {/* ── Desktop: floating bubbles, no bar ── */}
      <nav className="hidden md:block sticky top-0 z-40 pointer-events-none">
        <div className="rs-container">
          <div className="flex items-center justify-between h-24">
            <Float i={0} className="pointer-events-auto">
              <Brand />
            </Float>
            <div className="flex items-center gap-2.5 pointer-events-auto">
              {navItems.map(({ href, label, Icon }, i) => (
                <Float key={href} i={i + 1}>
                  <NavBubble
                    href={href}
                    label={label}
                    Icon={Icon}
                    active={pathname === href}
                    layoutId="nav-bubble"
                  />
                </Float>
              ))}
              <Float i={navItems.length + 1}>
                <DarkToggle dark={dark} toggle={toggleDark} />
              </Float>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile top: brand + theme bubbles, no bar ── */}
      <nav className="md:hidden sticky top-0 z-40 pointer-events-none safe-top">
        <div className="flex items-center justify-between px-4 h-16">
          <Float i={0} className="pointer-events-auto">
            <Brand compact />
          </Float>
          <Float i={1} className="pointer-events-auto">
            <DarkToggle dark={dark} toggle={toggleDark} />
          </Float>
        </div>
      </nav>

      {/* ── Mobile bottom: detached floating dock of bubbles ──
          No transform on the fixed wrapper on purpose: combining position:fixed
          with a transform on iOS Safari detaches it during URL-bar collapse. */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 safe-bottom pointer-events-none">
        <div className="mx-auto mb-1 w-fit flex items-center gap-2.5 pointer-events-auto">
          {navItems.map(({ href, label, Icon }, i) => (
            <Float key={href} i={i}>
              <NavBubble
                href={href}
                label={label}
                Icon={Icon}
                active={pathname === href}
                layoutId="bottom-bubble"
                size="w-12 h-12"
                iconClass="text-[1.35rem]"
              />
            </Float>
          ))}
        </div>
      </div>
    </>
  );
}
