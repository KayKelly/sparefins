"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBoardListing } from "@/app/actions/boards";
import {
  BOARD_TYPES,
  BOARD_FIN_SETUPS,
  BOARD_FIN_SYSTEMS,
  CONDITIONS,
  NZ_REGIONS,
} from "@/lib/constants";
import type {
  BoardType,
  BoardFinSetup,
  BoardFinSystem,
  ListingCondition,
} from "@/lib/types/database";

interface BoardListingForEdit {
  id: string;
  title: string;
  description: string | null;
  price_nzd: number | null;
  condition: ListingCondition;
  location_label: string | null;
  board_details: {
    board_type: BoardType | null;
    fin_setup: BoardFinSetup | null;
    fin_system: BoardFinSystem | null;
    length_inches: number | null;
    volume_litres: number | null;
  };
}

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const fieldClass = "space-y-2.5";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 text-base font-semibold text-foreground">{children}</h2>
  );
}

function splitLength(totalInches: number | null): {
  feet: string;
  inches: string;
} {
  if (totalInches == null) return { feet: "", inches: "" };
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet: String(feet), inches: String(inches) };
}

export default function EditBoardListingForm({
  listing,
}: {
  listing: BoardListingForEdit;
}) {
  const boundAction = updateBoardListing.bind(null, listing.id);
  const [state, action, pending] = useActionState(boundAction, { errors: {} });

  const board = listing.board_details;
  const { feet, inches } = splitLength(board.length_inches);

  return (
    <form action={action} className="space-y-8">
      {state.errors._form && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.errors._form}
        </div>
      )}

      <section>
        <SectionHeading>Board details</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={fieldClass}>
            <Label htmlFor="board_type">Board type</Label>
            <select
              id="board_type"
              name="board_type"
              defaultValue={board.board_type ?? ""}
              className={selectClass}
            >
              <option value="">Select type…</option>
              {BOARD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <FieldError message={state.errors.board_type} />
          </div>

          <div className={fieldClass}>
            <Label htmlFor="fin_setup">Fin setup</Label>
            <select
              id="fin_setup"
              name="fin_setup"
              defaultValue={board.fin_setup ?? ""}
              className={selectClass}
            >
              <option value="">Unknown / N/A</option>
              {BOARD_FIN_SETUPS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FieldError message={state.errors.fin_setup} />
          </div>

          <div className={fieldClass}>
            <Label htmlFor="fin_system">Fin system</Label>
            <select
              id="fin_system"
              name="fin_system"
              defaultValue={board.fin_system ?? ""}
              className={selectClass}
            >
              <option value="">Unknown / N/A</option>
              {BOARD_FIN_SYSTEMS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FieldError message={state.errors.fin_system} />
          </div>

          <div className={fieldClass}>
            <Label>Length</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="length_feet"
                  name="length_feet"
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  defaultValue={feet}
                  placeholder="6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ft
                </span>
              </div>
              <div className="relative flex-1">
                <Input
                  id="length_inches_rem"
                  name="length_inches_rem"
                  type="number"
                  min="0"
                  max="11"
                  step="1"
                  defaultValue={inches}
                  placeholder="2"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  in
                </span>
              </div>
            </div>
            <FieldError message={state.errors.length_feet} />
            <FieldError message={state.errors.length_inches_rem} />
          </div>

          <div className={fieldClass}>
            <Label htmlFor="volume_litres">Volume</Label>
            <div className="relative">
              <Input
                id="volume_litres"
                name="volume_litres"
                type="number"
                min="0"
                step="0.1"
                defaultValue={board.volume_litres ?? ""}
                placeholder="35.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                L
              </span>
            </div>
            <FieldError message={state.errors.volume_litres} />
          </div>
        </div>
      </section>

      <section>
        <SectionHeading>Listing details</SectionHeading>
        <div className="grid gap-4">
          <div className={fieldClass}>
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

          <div className={fieldClass}>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={listing.description ?? ""}
              placeholder="Shaper, glassing, any dings or repairs, why you're selling…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={fieldClass}>
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

            <div className={fieldClass}>
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

      <section>
        <SectionHeading>Location</SectionHeading>
        <div className={`max-w-xs ${fieldClass}`}>
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
