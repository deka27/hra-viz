"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import hraMetadata from "../../public/data/hra/data_metadata.json";
import cnsMetadata from "../../public/data/cns/cns_data_metadata.json";

function _fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d)} ${mon[parseInt(m) - 1]} '${y.slice(2)}`;
}

const HRA_RANGE = hraMetadata.first_date && hraMetadata.last_date
  ? `${_fmtDate(hraMetadata.first_date)} – ${_fmtDate(hraMetadata.last_date)}`
  : "";
const CNS_RANGE = cnsMetadata.first_date && cnsMetadata.last_date
  ? `${_fmtDate(cnsMetadata.first_date)} – ${_fmtDate(cnsMetadata.last_date)}`
  : "";

const hraLinks = [
  { href: "/hra",          label: "Overview"            },
  { href: "/hra/tools",     label: "Usage + Reliability" },
  { href: "/hra/features",  label: "Tool Behaviour"      },
  { href: "/hra/geo",       label: "Geography"           },
  { href: "/hra/journeys",  label: "Journeys"            },
  { href: "/hra/insights",  label: "Insights"            },
  { href: "/hra/ml",        label: "ML Lab"              },
];

const cnsLinks = [
  { href: "/cns",           label: "Overview"          },
  { href: "/cns/traffic",   label: "Traffic"           },
  { href: "/cns/content",   label: "Content"           },
  { href: "/cns/geo",       label: "Geography"         },
  { href: "/cns/errors",    label: "Errors + Security" },
  { href: "/cns/referrers", label: "Referrers"         },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
      aria-label="Toggle theme"
    >
      <svg className="hidden dark:block" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg className="block dark:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

function HelpButton({ active }: { active: boolean }) {
  return (
    <Link
      href="/help"
      className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
        active
          ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800"
      }`}
      aria-label="Open data dictionary help page"
      title="Data Dictionary"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.82 1c0 2-3 2-3 4" />
        <path d="M12 17h.01" />
      </svg>
    </Link>
  );
}

function SiteToggle({ isHRA, isCNS }: { isHRA: boolean; isCNS: boolean }) {
  return (
    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
      <Link
        href="/hra"
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          isHRA
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        HRA
      </Link>
      <Link
        href="/cns"
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          isCNS
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        CNS
      </Link>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isCNS = pathname.startsWith("/cns");
  const isHRA = pathname.startsWith("/hra");
  const navLinks = isCNS ? cnsLinks : hraLinks;
  const dataRange = isCNS ? CNS_RANGE : HRA_RANGE;

  const linkClass = (href: string) => {
    const isActive = isCNS
      ? (href === "/cns" ? pathname === "/cns" : pathname.startsWith(href))
      : (href === "/hra" ? pathname === "/hra" : pathname.startsWith(href));
    return `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/50"
    }`;
  };

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Toggle + Logo */}
          <div className="flex items-center gap-3">
            <SiteToggle isHRA={isHRA} isCNS={isCNS} />
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isCNS ? "bg-amber-500" : "bg-blue-500"}`} />
              <div className={`w-2 h-2 rounded-full ${isCNS ? "bg-orange-500" : "bg-violet-500"}`} />
              <div className={`w-2 h-2 rounded-full ${isCNS ? "bg-red-500" : "bg-emerald-500"}`} />
            </div>
            <Link href={isCNS ? "/cns" : "/hra"} className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {isCNS ? "CNS" : "HRA"}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">Analytics</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: data range + theme toggle + hamburger */}
          <div className="flex items-center gap-1">
            {dataRange && (
              <span className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-200 dark:text-zinc-200 font-medium mr-2 bg-zinc-700 dark:bg-zinc-800 border border-zinc-600 dark:border-zinc-600 rounded-md px-2.5 py-1 leading-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                Data: {dataRange}
              </span>
            )}
            <HelpButton active={pathname === "/help"} />
            <ThemeToggle />

            {/* Hamburger — visible below sm */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
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
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 flex flex-col gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                (isCNS ? (link.href === "/cns" ? pathname === "/cns" : pathname.startsWith(link.href)) : (link.href === "/hra" ? pathname === "/hra" : pathname.startsWith(link.href)))
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
