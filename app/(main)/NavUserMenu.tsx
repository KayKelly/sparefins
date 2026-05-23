"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function NavUserMenu({
  user,
  unreadCount = 0,
}: {
  user: User | null;
  unreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-sand-100)]"
      >
        Sign in
      </Link>
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  const email = user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-teal-100)] text-xs font-semibold text-[var(--color-teal-700)] hover:bg-[var(--color-teal-200)]"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[160px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          <div className="border-b border-[var(--color-border)] px-4 py-2 text-xs text-muted-foreground">
            {email}
          </div>
          <Link
            href="/messages"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-2 text-sm hover:bg-[var(--color-sand-50)]"
          >
            Messages
            {unreadCount > 0 && (
              <span className="rounded-full bg-[var(--color-teal-500)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/listings/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-[var(--color-sand-50)]"
          >
            My listings
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-sand-50)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
