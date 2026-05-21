"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createListing } from "@/app/actions/listings";
import {
  FIN_SYSTEMS,
  FIN_SIZES,
  FIN_POSITIONS,
  FIN_SIDES,
  CONDITIONS,
  NZ_REGIONS,
  MAX_IMAGES,
} from "@/lib/constants";

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

function buildAutoTitle(
  system: string,
  size: string,
  position: string,
  side: string
): string {
  const sysLabel =
    FIN_SYSTEMS.find((s) => s.value === system)?.label ?? "";
  const sizeLabel =
    FIN_SIZES.find((s) => s.value === size)?.label ?? "";
  const posLabel =
    FIN_POSITIONS.find((s) => s.value === position)?.label ?? "";
  const sideLabel =
    side && side !== "na"
      ? (FIN_SIDES.find((s) => s.value === side)?.label ?? "")
      : "";

  return [sysLabel, sizeLabel, posLabel, sideLabel]
    .filter(Boolean)
    .join(" ")
    .trim();
}

// ── Image upload preview ───────────────────────────────────────────────────

function ImageUpload({
  previews,
  onAdd,
  onRemove,
  error,
}: {
  previews: { url: string; name: string }[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {previews.map((p, i) => (
          <div key={i} className="relative h-24 w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.name}
              className="h-24 w-24 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-xs hover:bg-destructive"
              aria-label={`Remove ${p.name}`}
            >
              ×
            </button>
          </div>
        ))}

        {previews.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-ring hover:text-foreground"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-xs">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        name="images"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) {
            onAdd(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <FieldError message={error} />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Up to {MAX_IMAGES} photos. JPG, PNG, HEIC. First photo is the cover.
      </p>
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────

export default function FinListingForm() {
  const [state, action, pending] = useActionState(createListing, {
    errors: {},
  });

  // Controlled fin attributes for auto-title
  const [system, setSystem] = useState("");
  const [size, setSize] = useState("");
  const [position, setPosition] = useState("");
  const [side, setSide] = useState("na");

  // Title: starts blank, auto-filled when attributes change,
  // but user edits take over (tracked by `titleTouched`)
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (!titleTouched) {
      const auto = buildAutoTitle(system, size, position, side);
      setTitle(auto);
    }
  }, [system, size, position, side, titleTouched]);

  // Image previews (client-side only)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAddImages(files: FileList) {
    const incoming = Array.from(files);
    const available = MAX_IMAGES - imageFiles.length;
    const toAdd = incoming.slice(0, available);
    setImageFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => ({ url: URL.createObjectURL(f), name: f.name })),
    ]);
  }

  function handleRemoveImage(index: number) {
    URL.revokeObjectURL(previews[index].url);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  // Inject managed image files into FormData before the server action runs
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Let the form submit naturally via action={action} but we need to
    // attach the image files. We do this by appending to the form's own
    // FormData via a hidden DataTransfer trick — instead, we use a real
    // file input injected with the files. Since browsers don't allow setting
    // .files on an input programmatically, we use a different approach:
    // we let the native file inputs (one per file) carry the data.
    // The imageFiles state is only used for previews; the actual <input type="file">
    // carries the files natively. So we just let the form submit normally.
    void e; // no interception needed — file inputs carry the data
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Global form error */}
      {state.errors._form && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.errors._form}
        </div>
      )}

      {/* ── Fin attributes ──────────────────────────────────────────────── */}
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
              value={system}
              onChange={(e) => setSystem(e.target.value)}
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
              value={size}
              onChange={(e) => setSize(e.target.value)}
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
              value={position}
              onChange={(e) => setPosition(e.target.value)}
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
              value={side}
              onChange={(e) => setSide(e.target.value)}
              className={selectClass}
            >
              {FIN_SIDES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <FieldError message={state.errors.side} />
            <p className="mt-1 text-xs text-muted-foreground">
              Most rear fins are N/A. Only set Left/Right for asymmetric sets.
            </p>
          </div>

          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" name="brand" placeholder="e.g. FCS, Futures, Captain Fin" />
          </div>

          <div>
            <Label htmlFor="model">Model</Label>
            <Input id="model" name="model" placeholder="e.g. Performer PC, K2.1" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="quantity">Quantity</Label>
            <select id="quantity" name="quantity" className={selectClass} defaultValue="1">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "fin" : "fins"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Selling a matched pair? Select 2.
            </p>
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
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleTouched(true);
              }}
              placeholder="e.g. FCS II Medium Rear"
              maxLength={120}
            />
            <FieldError message={state.errors.title} />
            {!titleTouched && title && (
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-generated from attributes. Edit if you want something
                different.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
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
                className={selectClass}
                defaultValue=""
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
                  placeholder="0"
                  className="pl-7"
                />
              </div>
              <FieldError message={state.errors.price_nzd} />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave blank to show as &ldquo;Make an offer&rdquo;.
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
            className={selectClass}
            defaultValue=""
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

      {/* ── Photos ───────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Photos</SectionHeading>
        <ImageUpload
          previews={previews}
          onAdd={handleAddImages}
          onRemove={handleRemoveImage}
          error={state.errors.images}
        />
        {/* Hidden file inputs carrying the actual File objects for FormData */}
        {imageFiles.map((file, i) => (
          <HiddenFileInput key={i} file={file} />
        ))}
      </section>

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-t border-border pt-6">
        <Button type="submit" disabled={pending} className="min-w-[140px]">
          {pending ? "Publishing…" : "Publish listing"}
        </Button>
        <a
          href="/fins"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

// Transfers a File object into a real <input type="file"> via DataTransfer
// so it's included in the form's native FormData submission.
function HiddenFileInput({ file }: { file: File }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    ref.current.files = dt.files;
  }, [file]);

  return (
    <input ref={ref} type="file" name="images" className="sr-only" readOnly />
  );
}
