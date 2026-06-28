"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useDarkMode from "../hooks/useDarkMode";
import { springSoft } from "../lib/motion";
import {
  HomeIcon, BookIcon, ListIcon, CalendarIcon, SettingsIcon, SunIcon, MoonIcon,
} from "./icons";

const navItems = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/topics", label: "Topics", Icon: BookIcon },
  { href: "/list", label: "List", Icon: ListIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

function DarkToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rs-btn-ghost grid place-items-center w-11 h-11 rounded-full text-xl"
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
    <Link href="/" className="flex items-center gap-2.5 group">
      <span className="relative inline-grid place-items-center">
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 blur-[6px] opacity-50 group-hover:opacity-70 transition-opacity" />
        <Image
          src="/logo.png"
          alt="Recall Smart"
          width={compact ? 30 : 34}
          height={compact ? 30 : 34}
          className="relative rounded-xl ring-1 ring-black/5"
        />
      </span>
      <span className={`font-extrabold tracking-tight text-text ${compact ? "text-base" : "text-lg"}`}>
        Recall <span className="rs-gradient-text">Smart</span>
      </span>
    </Link>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { dark, toggle: toggleDark } = useDarkMode();

  return (
    <>
      {/* ── Desktop top bar ── */}
      <nav className="hidden md:block sticky top-0 z-40 rs-glass border-b border-border">
        <div className="rs-container">
          <div className="flex items-center justify-between h-16">
            <Brand />
            <div className="flex items-center gap-1">
              {navItems.map(({ href, label, Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors ${
                      active ? "text-on-primary" : "text-muted hover:text-text"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={springSoft}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_8px_20px_-6px_rgba(109,40,217,0.5)]"
                      />
                    )}
                    <span className="relative text-lg"><Icon /></span>
                    <span className="relative">{label}</span>
                  </Link>
                );
              })}
              <div className="w-px h-6 bg-border mx-1.5" />
              <DarkToggle dark={dark} toggle={toggleDark} />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <nav className="md:hidden sticky top-0 z-40 rs-glass border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <Brand compact />
          <DarkToggle dark={dark} toggle={toggleDark} />
        </div>
      </nav>

      {/* ── Mobile bottom bar ──
          No transform here on purpose: combining position:fixed with a
          transform on iOS Safari detaches the bar during URL-bar collapse. */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 rs-glass border-t border-border safe-bottom">
        <div className="flex items-stretch justify-around h-16">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center flex-1 gap-0.5"
              >
                <span className="relative grid place-items-center w-11 h-8">
                  {active && (
                    <motion.span
                      layoutId="bottom-pill"
                      transition={springSoft}
                      className="absolute inset-0 rounded-2xl bg-primary-soft"
                    />
                  )}
                  <motion.span
                    animate={{ scale: active ? 1.06 : 1, y: active ? -1 : 0 }}
                    transition={springSoft}
                    className={`relative text-[1.45rem] transition-colors ${
                      active ? "text-primary" : "text-faint"
                    }`}
                  >
                    <Icon />
                  </motion.span>
                </span>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    active ? "text-primary" : "text-faint"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
