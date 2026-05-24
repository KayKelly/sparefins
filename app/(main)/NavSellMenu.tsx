"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function NavSellMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        aria-label="Sell menu"
        aria-expanded={open}
      >
        Sell
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[140px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          <Link
            href="/listings/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-[var(--color-sand-50)]"
          >
            Sell a fin
          </Link>
          <Link
            href="/boards/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-[var(--color-sand-50)]"
          >
            Sell a board
          </Link>
        </div>
      )}
    </div>
  );
}
