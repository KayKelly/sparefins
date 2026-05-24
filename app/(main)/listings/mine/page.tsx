import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getListingImageUrl } from "@/lib/supabase/storage";
import { markListingStatus } from "@/app/actions/listings";
import { SYSTEM_LABELS } from "@/lib/fin-labels";
import type { FinSystem, ListingCondition, ListingStatus } from "@/lib/types/database";

export const metadata: Metadata = { title: "My listings" };

// ── Types ──────────────────────────────────────────────────────────────────

interface MyListing {
  id: string;
  title: string;
  price_nzd: number | null;
  condition: ListingCondition;
  status: ListingStatus;
  created_at: string;
  fin_details: { system: FinSystem } | null;
  cover_path: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: "bg-green-100 text-green-800",
  sold: "bg-gray-100 text-gray-600",
  paused: "bg-yellow-100 text-yellow-800",
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Active",
  sold: "Sold",
  paused: "Paused",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// ── Status toggle form ─────────────────────────────────────────────────────

function StatusToggleForm({
  listingId,
  currentStatus,
}: {
  listingId: string;
  currentStatus: ListingStatus;
}) {
  const action = markListingStatus.bind(null, listingId);

  if (currentStatus === "active") {
    return (
      <form action={action}>
        <input type="hidden" name="status" value="sold" />
        <button
          type="submit"
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground"
        >
          Mark as sold
        </button>
      </form>
    );
  }

  if (currentStatus === "sold" || currentStatus === "paused") {
    return (
      <form action={action}>
        <input type="hidden" name="status" value="active" />
        <button
          type="submit"
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground"
        >
          Relist
        </button>
      </form>
    );
  }

  return null;
}

// ── Listing card ───────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: MyListing }) {
  const imageUrl = listing.cover_path
    ? getListingImageUrl(listing.cover_path)
    : null;

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
            🏄
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/fins/${listing.id}`}
              className="block truncate font-semibold hover:text-[var(--color-teal-600)]"
            >
              {listing.title}
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {listing.fin_details
                ? SYSTEM_LABELS[listing.fin_details.system]
                : "Fin"}
              {listing.price_nzd != null
                ? ` · $${listing.price_nzd.toFixed(0)}`
                : " · Make an offer"}
              {" · "}
              {formatDate(listing.created_at)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[listing.status]}`}
          >
            {STATUS_LABELS[listing.status]}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/listings/${listing.id}/edit`}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Edit
          </Link>
          <StatusToggleForm
            listingId={listing.id}
            currentStatus={listing.status}
          />
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/listings/mine");

  const { data: rows } = await supabase
    .from("listings")
    .select(
      `
      id, title, price_nzd, condition, status, created_at,
      fin_details(system),
      listing_images(storage_path, display_order)
    `
    )
    .eq("user_id", user.id)
    .eq("category", "fin")
    .order("created_at", { ascending: false });

  const listings: MyListing[] = (rows ?? []).map((row) => {
    const finDetails = row.fin_details;
    const fin = Array.isArray(finDetails) ? finDetails[0] : finDetails;
    const images = [...(row.listing_images ?? [])].sort(
      (a, b) => a.display_order - b.display_order
    );
    return {
      id: row.id,
      title: row.title,
      price_nzd: row.price_nzd,
      condition: row.condition,
      status: row.status,
      created_at: row.created_at,
      fin_details: fin ?? null,
      cover_path: images[0]?.storage_path ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My listings</h1>
        <Link
          href="/listings/new"
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          + New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">You have no listings yet.</p>
          <Link
            href="/listings/new"
            className="mt-4 inline-block rounded-md bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            List a fin
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
