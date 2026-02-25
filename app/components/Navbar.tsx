"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/",          label: "Overview"      },
  { href: "/tools",     label: "Tool Usage"    },
  { href: "/features",  label: "Features"      },
  { href: "/geo",       label: "Geographic"    },
  { href: "/network",   label: "Opportunities" },
  { href: "/insights",  label: "Insights"      },
  { href: "/ml",        label: "ML"            },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-zinc-800 text-zinc-50"
        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
    }`;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
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
              <span className="font-semibold text-zinc-50 tracking-tight">HRA</span>
              <span className="text-zinc-500 text-sm font-medium">Analytics</span>
            </Link>
          </div>

          {/* Desktop nav — hidden below sm */}
          <div className="hidden sm:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Hamburger — visible below sm */}
          <button
            className="sm:hidden flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-zinc-200 transition-colors"
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

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-2 flex flex-col gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
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
