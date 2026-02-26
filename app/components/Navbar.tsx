"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";

const navLinks = [
  { href: "/",          label: "Overview"            },
  { href: "/tools",     label: "Usage + Reliability" },
  { href: "/features",  label: "Tool Behaviour"      },
  { href: "/geo",       label: "Geography"           },
  { href: "/journeys",  label: "Journeys"            },
  { href: "/insights",  label: "Insights"            },
  { href: "/ml",        label: "ML Lab"              },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
      aria-label="Toggle theme"
    >
      {/* Sun icon in dark mode */}
      <svg className="hidden dark:block" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      {/* Moon icon in light mode */}
      <svg className="block dark:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/50"
    }`;

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <Link href="/" className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">HRA</span>
              <span className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">Analytics</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: theme toggle + hamburger */}
          <div className="flex items-center gap-1">
            <ThemeToggle />

            {/* Hamburger — visible below sm */}
            <button
              className="sm:hidden flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 flex flex-col gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
