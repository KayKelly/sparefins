"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  FIN_SYSTEMS,
  FIN_SIZES,
  FIN_POSITIONS,
  FIN_SIDES,
  CONDITIONS,
  NZ_REGIONS,
} from "@/lib/constants";

const selectClass =
  "rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

interface ActiveFilters {
  system?: string;
  size?: string;
  position?: string;
  side?: string;
  condition?: string;
  location?: string;
}

export default function FinFilters({ active }: { active: ActiveFilters }) {
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
      className={`transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={active.system ?? ""}
          onChange={(e) => update("system", e.target.value)}
          className={selectClass}
          aria-label="Fin system"
        >
          <option value="">All systems</option>
          {FIN_SYSTEMS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={active.size ?? ""}
          onChange={(e) => update("size", e.target.value)}
          className={selectClass}
          aria-label="Size"
        >
          <option value="">Any size</option>
          {FIN_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={active.position ?? ""}
          onChange={(e) => update("position", e.target.value)}
          className={selectClass}
          aria-label="Position"
        >
          <option value="">Any position</option>
          {FIN_POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          value={active.side ?? ""}
          onChange={(e) => update("side", e.target.value)}
          className={selectClass}
          aria-label="Side"
        >
          <option value="">Any side</option>
          {FIN_SIDES.filter((s) => s.value !== "na").map((s) => (
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
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
