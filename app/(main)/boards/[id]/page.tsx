import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getListingImageUrl } from "@/lib/supabase/storage";
import {
  BOARD_TYPE_LABELS,
  BOARD_TYPE_COLORS,
  BOARD_FIN_SETUP_LABELS,
  BOARD_FIN_SYSTEM_LABELS,
  formatLength,
} from "@/lib/board-labels";
import { CONDITION_LABELS, CONDITION_COLORS } from "@/lib/fin-labels";
import type {
  BoardType,
  BoardFinSetup,
  BoardFinSystem,
  ListingCondition,
  ListingStatus,
} from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ContactSellerForm, {
  ContactSellerPrompt,
  OwnListingNotice,
} from "@/app/(main)/fins/[id]/ContactSellerForm";
import FinImageGallery from "@/app/(main)/fins/[id]/FinImageGallery";

// ── Types ─────────────────────────────────────────────────────────────────

interface BoardListingDetail {
  id: string;
  title: string;
  description: string | null;
  price_nzd: number | null;
  condition: ListingCondition;
  location_label: string | null;
  status: ListingStatus;
  user_id: string;
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

// ── Data fetching ─────────────────────────────────────────────────────────

async function fetchBoardListing(
  id: string
): Promise<BoardListingDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id, title, description, price_nzd, condition, location_label, status, user_id, created_at,
      board_details!inner(board_type, fin_setup, fin_system, length_inches, volume_litres),
      listing_images(storage_path, display_order)
    `
    )
    .eq("id", id)
    .eq("category", "board")
    .single();

  if (error || !data) return null;

  const bd = data.board_details;
  const board = Array.isArray(bd) ? bd[0] : bd;
  if (!board) return null;

  const images = [...(data.listing_images ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  return { ...data, board_details: board, listing_images: images } as BoardListingDetail;
}

// ── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchBoardListing(id);

  if (!listing) return { title: "Listing not found" };

  const board = listing.board_details;
  const coverImage = listing.listing_images[0];
  const typeLabel = board.board_type
    ? BOARD_TYPE_LABELS[board.board_type]
    : "Board";
  const description =
    listing.description ??
    `${typeLabel} for sale in New Zealand.`;

  return {
    title: listing.title,
    description,
    openGraph: coverImage
      ? { images: [getListingImageUrl(coverImage.storage_path)] }
      : undefined,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const listing = await fetchBoardListing(id);

  if (!listing) notFound();

  const board = listing.board_details;
  const isSold = listing.status === "sold";
  const isOwnListing = user?.id === listing.user_id;
  const loginNext = `/boards/${listing.id}`;

  const typeLabel = board.board_type
    ? BOARD_TYPE_LABELS[board.board_type]
    : "Board";
  const typeColor = board.board_type
    ? BOARD_TYPE_COLORS[board.board_type]
    : "bg-gray-100 text-gray-700";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-6">
        <Link
          href="/boards"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to boards
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Images — reuse the fin gallery; board type badge plays the "system" role */}
        <FinImageGallery
          images={listing.listing_images}
          title={listing.title}
          systemLabel={typeLabel}
          systemColor={typeColor}
          quantity={1}
        />

        {/* Details */}
        <div className="flex flex-col">
          {isSold && (
            <Badge className="mb-3 w-fit border-0 bg-muted text-muted-foreground">
              Sold
            </Badge>
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
            {board.board_type && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColor}`}
              >
                {typeLabel}
              </span>
            )}
            {board.fin_setup && (
              <Badge variant="secondary" className="text-xs">
                {BOARD_FIN_SETUP_LABELS[board.fin_setup]}
              </Badge>
            )}
            {board.length_inches != null && (
              <Badge variant="secondary" className="text-xs">
                {formatLength(board.length_inches)}
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

          <Separator className="my-6" />

          {/* Specs */}
          <dl className="divide-y divide-border rounded-lg border border-border bg-card px-4">
            {board.board_type && (
              <SpecRow label="Type" value={BOARD_TYPE_LABELS[board.board_type]} />
            )}
            {board.length_inches != null && (
              <SpecRow
                label="Length"
                value={formatLength(board.length_inches)}
              />
            )}
            {board.volume_litres != null && (
              <SpecRow label="Volume" value={`${board.volume_litres}L`} />
            )}
            {board.fin_setup && (
              <SpecRow
                label="Fin setup"
                value={BOARD_FIN_SETUP_LABELS[board.fin_setup]}
              />
            )}
            {board.fin_system && (
              <SpecRow
                label="Fin system"
                value={BOARD_FIN_SYSTEM_LABELS[board.fin_system]}
              />
            )}
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

          {!isSold && isOwnListing && (
            <OwnListingNotice
              listingId={listing.id}
              editHref={`/listings/${listing.id}/edit`}
            />
          )}
          {!isSold && !isOwnListing && user && (
            <ContactSellerForm listingId={listing.id} />
          )}
          {!isSold && !isOwnListing && !user && (
            <ContactSellerPrompt loginNext={loginNext} />
          )}
          {isSold && (
            <p className="mt-8 text-sm text-muted-foreground">
              This board has sold.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
