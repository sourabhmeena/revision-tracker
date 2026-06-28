"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import LoginForm from "../../components/LoginForm";
import { BoltIcon, FlameIcon, CalendarIcon } from "../../components/icons";

const FEATURES = [
  { Icon: BoltIcon, title: "Beat the forgetting curve", desc: "Automatic spaced-repetition scheduling for every topic." },
  { Icon: FlameIcon, title: "Build daily streaks", desc: "Stay consistent and watch your momentum grow." },
  { Icon: CalendarIcon, title: "See the whole plan", desc: "A calendar and list view of every upcoming revision." },
];

export default function LoginPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      window.location.href = "/";
    } else {
      setReady(true);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = "/";
  };

  if (!ready) return null;

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Brand hero — large screens */}
      <div
        className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{ background: "linear-gradient(150deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)" }}
      >
        <div className="pointer-events-none absolute -top-24 -left-16 w-96 h-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-fuchsia-400/25 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative flex items-center gap-3"
        >
          <Image src="/logo.png" alt="Recall Smart" width={40} height={40} className="rounded-xl ring-1 ring-white/30" />
          <span className="text-xl font-extrabold tracking-tight">Recall Smart</span>
        </motion.div>

        <div className="relative max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-extrabold leading-tight tracking-tight"
          >
            Remember more.<br />Study less.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-4 text-white/80 text-lg"
          >
            The spaced-repetition planner that schedules your revisions so knowledge actually sticks.
          </motion.p>

          <div className="mt-9 space-y-4">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.28 + i * 0.1 }}
                className="flex items-start gap-3.5"
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/15 ring-1 ring-white/25 text-lg shrink-0">
                  <Icon />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">Made by Sourabh Meena · © 2026</p>
      </div>

      {/* Form */}
      <div className="relative flex flex-col items-center justify-center p-6 safe-top">
        <LoginForm onLogin={handleLogin} />
        <p className="mt-6 text-xs text-faint lg:hidden">Made by Sourabh Meena · © 2026</p>
      </div>
    </div>
  );
}
