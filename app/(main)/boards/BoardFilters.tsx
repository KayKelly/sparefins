"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  BOARD_TYPES,
  BOARD_FIN_SETUPS,
  BOARD_FIN_SYSTEMS,
  CONDITIONS,
  NZ_REGIONS,
} from "@/lib/constants";

const selectClass =
  "rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

interface ActiveFilters {
  boardType?: string;
  finSetup?: string;
  finSystem?: string;
  condition?: string;
  location?: string;
}

export default function BoardFilters({ active }: { active: ActiveFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const activeCount = Object.values(active).filter(Boolean).length;

  function clearAll() {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <div
      className={`transition-opacity ${isPending ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={active.boardType ?? ""}
          onChange={(e) => update("boardType", e.target.value)}
          className={selectClass}
          aria-label="Board type"
        >
          <option value="">All types</option>
          {BOARD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={active.finSetup ?? ""}
          onChange={(e) => update("finSetup", e.target.value)}
          className={selectClass}
          aria-label="Fin setup"
        >
          <option value="">Any fin setup</option>
          {BOARD_FIN_SETUPS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={active.finSystem ?? ""}
          onChange={(e) => update("finSystem", e.target.value)}
          className={selectClass}
          aria-label="Fin system"
        >
          <option value="">Any fin system</option>
          {BOARD_FIN_SYSTEMS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={active.condition ?? ""}
          onChange={(e) => update("condition", e.target.value)}
          className={selectClass}
          aria-label="Condition"
        >
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={active.location ?? ""}
          onChange={(e) => update("location", e.target.value)}
          className={selectClass}
          aria-label="Location"
        >
          <option value="">Anywhere in NZ</option>
          {NZ_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
