import Link from "next/link";
import Image from "next/image";
import { getListingImageUrl } from "@/lib/supabase/storage";
import { Badge } from "@/components/ui/badge";
import type { FinSystem, FinSizeBucket, FinPosition, FinSide, ListingCondition } from "@/lib/types/database";

// ── Label maps ────────────────────────────────────────────────────────────

const SYSTEM_LABELS: Record<FinSystem, string> = {
  fcs: "FCS",
  fcs2: "FCS II",
  futures: "Futures",
  single_tab: "Single Tab",
  longboard_box: "Longboard Box",
  other: "Other",
};

const SYSTEM_COLORS: Record<FinSystem, string> = {
  fcs: "bg-blue-100 text-blue-800",
  fcs2: "bg-indigo-100 text-indigo-800",
  futures: "bg-amber-100 text-amber-800",
  single_tab: "bg-purple-100 text-purple-800",
  longboard_box: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-700",
};

const SIZE_LABELS: Record<FinSizeBucket, string> = {
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
};

const POSITION_LABELS: Record<FinPosition, string> = {
  front: "Front",
  rear: "Rear",
  center: "Centre",
  side_bite: "Side Bite",
};

const SIDE_LABELS: Record<FinSide, string> = {
  na: "",
  left: "Left",
  right: "Right",
};

const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: "New",
  like_new: "Like new",
  used_light: "Used",
  used_visible: "Used",
  repaired: "Repaired",
};

const CONDITION_COLORS: Record<ListingCondition, string> = {
  new: "bg-green-100 text-green-800",
  like_new: "bg-emerald-100 text-emerald-800",
  used_light: "bg-yellow-100 text-yellow-800",
  used_visible: "bg-orange-100 text-orange-800",
  repaired: "bg-red-100 text-red-800",
};

// ── Types ─────────────────────────────────────────────────────────────────

export interface FinCardData {
  id: string;
  title: string;
  price_nzd: number | null;
  condition: ListingCondition;
  location_label: string | null;
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

// ── Component ─────────────────────────────────────────────────────────────

export default function FinCard({ listing }: { listing: FinCardData }) {
  const { fin_details: fin, listing_images } = listing;

  const coverImage = listing_images
    .slice()
    .sort((a, b) => a.display_order - b.display_order)[0];

  const systemLabel = SYSTEM_LABELS[fin.system];
  const systemColor = SYSTEM_COLORS[fin.system];

  return (
    <Link
      href={`/fins/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-[var(--color-teal-300)] hover:shadow-sm transition-all"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-sand-100">
        {coverImage ? (
          <Image
            src={getListingImageUrl(coverImage.storage_path)}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground/30">
            🏄
          </div>
        )}
        {/* System badge overlaid on image */}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${systemColor}`}
        >
          {systemLabel}
        </span>
        {fin.quantity > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-semibold text-background">
            ×{fin.quantity}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {listing.title}
        </h3>

        {/* Attribute pills */}
        <div className="flex flex-wrap gap-1">
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
            className={`text-xs border-0 ${CONDITION_COLORS[listing.condition]}`}
          >
            {CONDITION_LABELS[listing.condition]}
          </Badge>
        </div>

        {/* Price + location */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <span className="text-base font-semibold">
            {listing.price_nzd != null
              ? `$${listing.price_nzd.toFixed(0)}`
              : "Offer"}
          </span>
          {listing.location_label && (
            <span className="text-xs text-muted-foreground truncate">
              {listing.location_label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
