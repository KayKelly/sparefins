"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBoardListing } from "@/app/actions/boards";
import {
  BOARD_TYPES,
  BOARD_FIN_SETUPS,
  BOARD_FIN_SYSTEMS,
  CONDITIONS,
  NZ_REGIONS,
  MAX_IMAGES,
} from "@/lib/constants";

// ── Helpers ────────────────────────────────────────────────────────────────

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

function buildAutoTitle(boardType: string, feet: string): string {
  const typeLabel =
    BOARD_TYPES.find((t) => t.value === boardType)?.label ?? "";
  const feetNum = parseInt(feet);
  const lengthStr = !isNaN(feetNum) && feetNum > 0 ? `${feetNum}'` : "";
  return [lengthStr, typeLabel].filter(Boolean).join(" ").trim();
}

// ── Image upload ───────────────────────────────────────────────────────────

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
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs text-background hover:bg-destructive"
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

// ── Main form ──────────────────────────────────────────────────────────────

export default function BoardListingForm() {
  const [state, action, pending] = useActionState(createBoardListing, {
    errors: {},
  });

  const [boardType, setBoardType] = useState("");
  const [feet, setFeet] = useState("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (!titleTouched) {
      setTitle(buildAutoTitle(boardType, feet));
    }
  }, [boardType, feet, titleTouched]);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);

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

  return (
    <form action={action} className="space-y-8">
      {state.errors._form && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.errors._form}
        </div>
      )}

      {/* ── Board details ────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Board details</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={fieldClass}>
            <Label htmlFor="board_type">Board type</Label>
            <select
              id="board_type"
              name="board_type"
              value={boardType}
              onChange={(e) => setBoardType(e.target.value)}
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
              className={selectClass}
              defaultValue=""
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
              className={selectClass}
              defaultValue=""
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
                  placeholder="6"
                  value={feet}
                  onChange={(e) => setFeet(e.target.value)}
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

      {/* ── Listing details ──────────────────────────────────────────────── */}
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
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleTouched(true);
              }}
              placeholder="e.g. 6'2 Shortboard"
              maxLength={120}
            />
            <FieldError message={state.errors.title} />
            {!titleTouched && title && (
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-generated. Edit if you want something different.
              </p>
            )}
          </div>

          <div className={fieldClass}>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
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
        <div className={`max-w-xs ${fieldClass}`}>
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
          href="/boards"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
