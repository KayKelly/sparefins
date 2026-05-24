"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateListing } from "@/app/actions/listings";
import {
  FIN_SYSTEMS,
  FIN_SIZES,
  FIN_POSITIONS,
  FIN_SIDES,
  CONDITIONS,
  NZ_REGIONS,
} from "@/lib/constants";
import type {
  FinSystem,
  FinSizeBucket,
  FinPosition,
  FinSide,
  ListingCondition,
} from "@/lib/types/database";

// ── Types ──────────────────────────────────────────────────────────────────

interface ListingForEdit {
  id: string;
  title: string;
  description: string | null;
  price_nzd: number | null;
  condition: ListingCondition;
  location_label: string | null;
  fin_details: {
    system: FinSystem;
    size_bucket: FinSizeBucket | null;
    position: FinPosition | null;
    side: FinSide;
    quantity: number;
    brand: string | null;
    model: string | null;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-base font-semibold text-foreground">{children}</h2>
  );
}

// ── Form ───────────────────────────────────────────────────────────────────

export default function EditListingForm({
  listing,
}: {
  listing: ListingForEdit;
}) {
  const boundAction = updateListing.bind(null, listing.id);
  const [state, action, pending] = useActionState(boundAction, { errors: {} });

  const fin = listing.fin_details;

  return (
    <form action={action} className="space-y-8">
      {state.errors._form && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.errors._form}
        </div>
      )}

      {/* ── Fin details ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Fin details</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="system">
              Fin system <span className="text-destructive">*</span>
            </Label>
            <select
              id="system"
              name="system"
              required
              defaultValue={fin.system}
              className={selectClass}
            >
              <option value="">Select system…</option>
              {FIN_SYSTEMS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FieldError message={state.errors.system} />
          </div>

          <div>
            <Label htmlFor="size_bucket">Size</Label>
            <select
              id="size_bucket"
              name="size_bucket"
              defaultValue={fin.size_bucket ?? ""}
              className={selectClass}
            >
              <option value="">Any / unknown</option>
              {FIN_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FieldError message={state.errors.size_bucket} />
          </div>

          <div>
            <Label htmlFor="position">Position</Label>
            <select
              id="position"
              name="position"
              defaultValue={fin.position ?? ""}
              className={selectClass}
            >
              <option value="">Any / unknown</option>
              {FIN_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <FieldError message={state.errors.position} />
          </div>

          <div>
            <Label htmlFor="side">Side</Label>
            <select
              id="side"
              name="side"
              defaultValue={fin.side}
              className={selectClass}
            >
              {FIN_SIDES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FieldError message={state.errors.side} />
          </div>

          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              name="brand"
              defaultValue={fin.brand ?? ""}
              placeholder="e.g. FCS, Futures, Captain Fin"
            />
          </div>

          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              name="model"
              defaultValue={fin.model ?? ""}
              placeholder="e.g. Performer PC, K2.1"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="quantity">Quantity</Label>
            <select
              id="quantity"
              name="quantity"
              defaultValue={fin.quantity}
              className={selectClass}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "fin" : "fins"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Listing details ──────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Listing details</SectionHeading>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={listing.title}
              maxLength={120}
            />
            <FieldError message={state.errors.title} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={listing.description ?? ""}
              placeholder="Condition notes, years of use, any repairs, reason for selling…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="condition">
                Condition <span className="text-destructive">*</span>
              </Label>
              <select
                id="condition"
                name="condition"
                required
                defaultValue={listing.condition}
                className={selectClass}
              >
                <option value="">Select condition…</option>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <FieldError message={state.errors.condition} />
            </div>

            <div>
              <Label htmlFor="price_nzd">Price (NZD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="price_nzd"
                  name="price_nzd"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={listing.price_nzd ?? ""}
                  placeholder="0"
                  className="pl-7"
                />
              </div>
              <FieldError message={state.errors.price_nzd} />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave blank for &ldquo;Make an offer&rdquo;.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Location ─────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Location</SectionHeading>
        <div className="max-w-xs">
          <Label htmlFor="location_label">
            Region <span className="text-destructive">*</span>
          </Label>
          <select
            id="location_label"
            name="location_label"
            required
            defaultValue={listing.location_label ?? ""}
            className={selectClass}
          >
            <option value="">Select region…</option>
            {NZ_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <FieldError message={state.errors.location_label} />
        </div>
      </section>

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-t border-border pt-6">
        <Button type="submit" disabled={pending} className="min-w-[140px]">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <a
          href="/listings/mine"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
