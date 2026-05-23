import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getListingImageUrl } from "@/lib/supabase/storage";
import {
  SYSTEM_LABELS,
  SYSTEM_COLORS,
  SIZE_LABELS,
  POSITION_LABELS,
  SIDE_LABELS,
  CONDITION_LABELS,
  CONDITION_COLORS,
} from "@/lib/fin-labels";
import type {
  FinSystem,
  FinSizeBucket,
  FinPosition,
  FinSide,
  ListingCondition,
  ListingStatus,
} from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ContactSellerForm, {
  ContactSellerPrompt,
  OwnListingNotice,
} from "./ContactSellerForm";
import FinImageGallery from "./FinImageGallery";

// ── Types ─────────────────────────────────────────────────────────────────

interface FinListingDetail {
  id: string;
  title: string;
  description: string | null;
  price_nzd: number | null;
  condition: ListingCondition;
  location_label: string | null;
  status: ListingStatus;
  user_id: string;
  created_at: string;
  fin_details: {
    system: FinSystem;
    size_bucket: FinSizeBucket | null;
    position: FinPosition | null;
    side: FinSide;
    quantity: number;
    brand: string | null;
    model: string | null;
  };
  listing_images: { storage_path: string; display_order: number }[];
}

// ── Data fetching ─────────────────────────────────────────────────────────

async function fetchFinListing(id: string): Promise<FinListingDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id, title, description, price_nzd, condition, location_label, status, user_id, created_at,
      fin_details!inner(system, size_bucket, position, side, quantity, brand, model),
      listing_images(storage_path, display_order)
    `
    )
    .eq("id", id)
    .eq("category", "fin")
    .single();

  if (error || !data) return null;

  const finDetails = data.fin_details;
  const fin = Array.isArray(finDetails) ? finDetails[0] : finDetails;

  if (!fin) return null;

  const images = [...(data.listing_images ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  return {
    ...data,
    fin_details: fin,
    listing_images: images,
  } as FinListingDetail;
}

// ── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchFinListing(id);

  if (!listing) {
    return { title: "Listing not found" };
  }

  const fin = listing.fin_details;
  const coverImage = listing.listing_images[0];
  const brandModel = [fin.brand, fin.model].filter(Boolean).join(" ");
  const description =
    listing.description ??
    `${SYSTEM_LABELS[fin.system]} fin${brandModel ? ` - ${brandModel}` : ""} for sale in New Zealand.`;

  return {
    title: listing.title,
    description,
    openGraph: coverImage
      ? { images: [getListingImageUrl(coverImage.storage_path)] }
      : undefined,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatListedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function FinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const listing = await fetchFinListing(id);

  if (!listing) notFound();

  const fin = listing.fin_details;
  const isSold = listing.status === "sold";
  const brandModel = [fin.brand, fin.model].filter(Boolean).join(" ");
  const isOwnListing = user?.id === listing.user_id;
  const loginNext = `/fins/${listing.id}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/fins"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to fins
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Images */}
        <FinImageGallery
          images={listing.listing_images}
          title={listing.title}
          systemLabel={SYSTEM_LABELS[fin.system]}
          systemColor={SYSTEM_COLORS[fin.system]}
          quantity={fin.quantity}
        />

        {/* Details */}
        <div className="flex flex-col">
          {isSold && (
            <Badge className="mb-3 w-fit border-0 bg-muted text-muted-foreground">
              Sold
            </Badge>
          )}

          {brandModel && (
            <p className="text-sm font-medium text-[var(--color-teal-600)]">
              {brandModel}
            </p>
          )}

          <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {listing.title}
          </h1>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {listing.price_nzd != null
              ? `$${listing.price_nzd.toFixed(0)}`
              : "Make an offer"}
          </p>

          {/* Attribute pills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SYSTEM_COLORS[fin.system]}`}
            >
              {SYSTEM_LABELS[fin.system]}
            </span>
            {fin.size_bucket && (
              <Badge variant="secondary" className="text-xs">
                {SIZE_LABELS[fin.size_bucket]}
              </Badge>
            )}
            {fin.position && (
              <Badge variant="secondary" className="text-xs">
                {POSITION_LABELS[fin.position]}
              </Badge>
            )}
            {fin.side && fin.side !== "na" && (
              <Badge variant="secondary" className="text-xs">
                {SIDE_LABELS[fin.side]}
              </Badge>
            )}
            <Badge
              className={`border-0 text-xs ${CONDITION_COLORS[listing.condition]}`}
            >
              {CONDITION_LABELS[listing.condition]}
            </Badge>
            {fin.quantity > 1 && (
              <Badge variant="secondary" className="text-xs">
                ×{fin.quantity} fins
              </Badge>
            )}
          </div>

          <Separator className="my-6" />

          {/* Specs */}
          <dl className="divide-y divide-border rounded-lg border border-border bg-card px-4">
            <SpecRow label="System" value={SYSTEM_LABELS[fin.system]} />
            {fin.size_bucket && (
              <SpecRow label="Size" value={SIZE_LABELS[fin.size_bucket]} />
            )}
            {fin.position && (
              <SpecRow label="Position" value={POSITION_LABELS[fin.position]} />
            )}
            {fin.side && fin.side !== "na" && (
              <SpecRow label="Side" value={SIDE_LABELS[fin.side]} />
            )}
            {fin.quantity > 1 && (
              <SpecRow label="Quantity" value={fin.quantity} />
            )}
            {fin.brand && <SpecRow label="Brand" value={fin.brand} />}
            {fin.model && <SpecRow label="Model" value={fin.model} />}
            <SpecRow
              label="Condition"
              value={CONDITION_LABELS[listing.condition]}
            />
            {listing.location_label && (
              <SpecRow label="Location" value={listing.location_label} />
            )}
            <SpecRow
              label="Listed"
              value={formatListedDate(listing.created_at)}
            />
          </dl>

          {listing.description && (
            <>
              <Separator className="my-6" />
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {listing.description}
                </p>
              </section>
            </>
          )}

          {!isSold && isOwnListing && <OwnListingNotice />}
          {!isSold && !isOwnListing && user && (
            <ContactSellerForm listingId={listing.id} />
          )}
          {!isSold && !isOwnListing && !user && (
            <ContactSellerPrompt loginNext={loginNext} />
          )}
          {isSold && (
            <p className="mt-8 text-sm text-muted-foreground">
              This fin has sold.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
