import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FinCard, { type FinCardData } from "./FinCard";
import FinFilters from "./FinFilters";
import type { Metadata } from "next";

// ── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const p = await searchParams;
  const parts: string[] = [];
  if (p.system) parts.push(p.system.toUpperCase().replace("FCS2", "FCS II"));
  if (p.size) parts.push(p.size.toUpperCase());
  if (p.position) parts.push(p.position);
  if (p.side && p.side !== "na") parts.push(p.side);

  const title = parts.length
    ? `${parts.join(" ")} fins for sale NZ`
    : "Surf fins for sale in New Zealand";

  return {
    title,
    description:
      "Browse second-hand surf fins in New Zealand. Filter by system (FCS, FCS II, Futures), size, position and side.",
  };
}

// ── Data fetching ─────────────────────────────────────────────────────────

type SearchParams = {
  system?: string;
  size?: string;
  position?: string;
  side?: string;
  condition?: string;
  location?: string;
};

async function fetchListings(filters: SearchParams): Promise<FinCardData[]> {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(
      `
      id, title, price_nzd, condition, location_label, created_at,
      fin_details!inner(system, size_bucket, position, side, quantity, brand, model),
      listing_images(storage_path, display_order)
    `
    )
    .eq("category", "fin")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters.system) query = query.eq("fin_details.system", filters.system);
  if (filters.size) query = query.eq("fin_details.size_bucket", filters.size);
  if (filters.position)
    query = query.eq("fin_details.position", filters.position);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.location)
    query = query.eq("location_label", filters.location);

  // Side filter: if left or right is selected, include 'na' fins too
  // (symmetric fins can fill any side position)
  if (filters.side === "left" || filters.side === "right") {
    query = query.or(`side.eq.${filters.side},side.eq.na`, {
      referencedTable: "fin_details",
    });
  }

  const { data, error } = await query;

  if (error) {
    console.error("fins query error:", error);
    return [];
  }

  return (data ?? []) as unknown as FinCardData[];
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function FinsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const filters: SearchParams = {
    system: params.system,
    size: params.size,
    position: params.position,
    side: params.side,
    condition: params.condition,
    location: params.location,
  };

  const listings = await fetchListings(filters);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Fins</h1>
          <p className="text-sm text-muted-foreground">
            {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/listings/new"
          className="rounded-md bg-[var(--color-accent)] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Sell a fin
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Suspense>
          <FinFilters active={filters} />
        </Suspense>
      </div>

      {/* Results */}
      {listings.length === 0 ? (
        <EmptyState hasFilters={Object.values(filters).some(Boolean)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {listings.map((listing) => (
            <FinCard key={listing.id} listing={listing} />
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
      <div className="text-5xl">🏄</div>
      {hasFilters ? (
        <>
          <p className="font-medium">No fins match those filters.</p>
          <p className="text-sm text-muted-foreground">
            Try removing some filters, or post a{" "}
            <Link
              href="/wanted/new"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Wanted post
            </Link>{" "}
            and get notified when one comes up.
          </p>
          <Link
            href="/fins"
            className="mt-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Clear filters
          </Link>
        </>
      ) : (
        <>
          <p className="font-medium">No fins listed yet.</p>
          <p className="text-sm text-muted-foreground">Be the first to sell.</p>
          <Link
            href="/listings/new"
            className="mt-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            List a fin
          </Link>
        </>
      )}
    </div>
  );
}
