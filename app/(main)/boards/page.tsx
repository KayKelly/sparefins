import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BoardCard, { type BoardCardData } from "./BoardCard";
import BoardFilters from "./BoardFilters";

// ── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const p = await searchParams;
  const parts: string[] = [];
  if (p.boardType) parts.push(p.boardType.replace("_", "-"));
  if (p.finSetup) parts.push(p.finSetup.replace("_", " "));

  const title = parts.length
    ? `${parts.join(" ")} surfboards for sale NZ`
    : "Surfboards for sale in New Zealand";

  return {
    title,
    description:
      "Browse second-hand surfboards in New Zealand. Filter by board type, fin setup, and fin system.",
  };
}

// ── Data fetching ─────────────────────────────────────────────────────────

type SearchParams = {
  boardType?: string;
  finSetup?: string;
  finSystem?: string;
  condition?: string;
  location?: string;
};

async function fetchListings(filters: SearchParams): Promise<BoardCardData[]> {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(
      `
      id, title, price_nzd, condition, location_label, created_at,
      board_details!inner(board_type, fin_setup, fin_system, length_inches, volume_litres),
      listing_images(storage_path, display_order)
    `
    )
    .eq("category", "board")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters.boardType)
    query = query.eq("board_details.board_type", filters.boardType);
  if (filters.finSetup)
    query = query.eq("board_details.fin_setup", filters.finSetup);
  if (filters.finSystem)
    query = query.eq("board_details.fin_system", filters.finSystem);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.location) query = query.eq("location_label", filters.location);

  const { data, error } = await query;

  if (error) {
    console.error("boards query error:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const bd = row.board_details;
    const board = Array.isArray(bd) ? bd[0] : bd;
    return { ...row, board_details: board } as unknown as BoardCardData;
  });
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function BoardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const filters: SearchParams = {
    boardType: params.boardType,
    finSetup: params.finSetup,
    finSystem: params.finSystem,
    condition: params.condition,
    location: params.location,
  };

  const listings = await fetchListings(filters);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Boards</h1>
          <p className="text-sm text-muted-foreground">
            {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/boards/new"
          className="rounded-md bg-[var(--color-accent)] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Sell a board
        </Link>
      </div>

      <div className="mb-6">
        <Suspense>
          <BoardFilters active={filters} />
        </Suspense>
      </div>

      {listings.length === 0 ? (
        <EmptyState hasFilters={Object.values(filters).some(Boolean)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {listings.map((listing) => (
            <BoardCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="text-5xl">🏄‍♂️</div>
      {hasFilters ? (
        <>
          <p className="font-medium">No boards match those filters.</p>
          <p className="text-sm text-muted-foreground">
            Try removing some filters to see more.
          </p>
          <Link
            href="/boards"
            className="mt-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Clear filters
          </Link>
        </>
      ) : (
        <>
          <p className="font-medium">No boards listed yet.</p>
          <p className="text-sm text-muted-foreground">Be the first to sell.</p>
          <Link
            href="/boards/new"
            className="mt-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            List a board
          </Link>
        </>
      )}
    </div>
  );
}
