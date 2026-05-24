import Link from "next/link";
import Image from "next/image";
import { getListingImageUrl } from "@/lib/supabase/storage";
import { Badge } from "@/components/ui/badge";
import type {
  BoardType,
  BoardFinSetup,
  BoardFinSystem,
  ListingCondition,
} from "@/lib/types/database";
import {
  BOARD_TYPE_LABELS,
  BOARD_TYPE_COLORS,
  BOARD_FIN_SETUP_LABELS,
  formatLength,
} from "@/lib/board-labels";
import { CONDITION_LABELS, CONDITION_COLORS } from "@/lib/fin-labels";

// ── Types ─────────────────────────────────────────────────────────────────

export interface BoardCardData {
  id: string;
  title: string;
  price_nzd: number | null;
  condition: ListingCondition;
  location_label: string | null;
  created_at: string;
  board_details: {
    board_type: BoardType | null;
    fin_setup: BoardFinSetup | null;
    fin_system: BoardFinSystem | null;
    length_inches: number | null;
    volume_litres: number | null;
  };
  listing_images: { storage_path: string; display_order: number }[];
}

// ── Component ─────────────────────────────────────────────────────────────

export default function BoardCard({ listing }: { listing: BoardCardData }) {
  const { board_details: board, listing_images } = listing;

  const coverImage = listing_images
    .slice()
    .sort((a, b) => a.display_order - b.display_order)[0];

  const typeLabel = board.board_type
    ? BOARD_TYPE_LABELS[board.board_type]
    : "Board";
  const typeColor = board.board_type
    ? BOARD_TYPE_COLORS[board.board_type]
    : "bg-gray-100 text-gray-700";

  return (
    <Link
      href={`/boards/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-[var(--color-teal-300)] hover:shadow-sm"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
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
            🏄‍♂️
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor}`}
        >
          {typeLabel}
        </span>
        {board.length_inches != null && (
          <span className="absolute right-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-semibold text-background">
            {formatLength(board.length_inches)}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {listing.title}
        </h3>

        <div className="flex flex-wrap gap-1">
          {board.fin_setup && (
            <Badge variant="secondary" className="text-xs">
              {BOARD_FIN_SETUP_LABELS[board.fin_setup]}
            </Badge>
          )}
          {board.volume_litres != null && (
            <Badge variant="secondary" className="text-xs">
              {board.volume_litres}L
            </Badge>
          )}
          <Badge
            className={`border-0 text-xs ${CONDITION_COLORS[listing.condition]}`}
          >
            {CONDITION_LABELS[listing.condition]}
          </Badge>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <span className="text-base font-semibold">
            {listing.price_nzd != null
              ? `$${listing.price_nzd.toFixed(0)}`
              : "Offer"}
          </span>
          {listing.location_label && (
            <span className="truncate text-xs text-muted-foreground">
              {listing.location_label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
