"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import useDarkMode from "../hooks/useDarkMode";

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "🏠" },
    { href: "/topics", label: "Topics", icon: "📚" },
    { href: "/list", label: "List View", icon: "📋" },
    { href: "/calendar", label: "Calendar", icon: "📅" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 relative z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          <h1 className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">
            📚 Revision Planner
          </h1>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={toggleDark}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
              title="Toggle dark mode"
            >
              {dark ? "☀️" : "🌙"}
            </button>
            {isLoggedIn ? (
              <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                Logout
              </button>
            ) : (
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
              title="Toggle dark mode"
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 w-6 bg-gray-700 dark:bg-gray-200 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 w-6 bg-gray-700 dark:bg-gray-200 transition-all ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-6 bg-gray-700 dark:bg-gray-200 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                    ${isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {isLoggedIn ? (
              <button onClick={logout} className="w-full text-left flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                <span>🚪</span>
                <span>Logout</span>
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                <span>🔑</span>
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
