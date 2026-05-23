"use client";

import { useState } from "react";
import Image from "next/image";
import { getListingImageUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

interface GalleryImage {
  storage_path: string;
  display_order: number;
}

export default function FinImageGallery({
  images,
  title,
  systemLabel,
  systemColor,
  quantity,
}: {
  images: GalleryImage[];
  title: string;
  systemLabel: string;
  systemColor: string;
  quantity: number;
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-sand-100">
        <div className="flex h-full items-center justify-center text-6xl text-muted-foreground/30">
          🏄
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-sand-100">
        <Image
          key={current.storage_path}
          src={getListingImageUrl(current.storage_path)}
          alt={images.length > 1 ? `${title} - photo ${selected + 1}` : title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority={selected === 0}
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold",
            systemColor
          )}
        >
          {systemLabel}
        </span>
        {quantity > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background">
            ×{quantity}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.storage_path}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`View photo ${index + 1}`}
              aria-current={selected === index ? "true" : undefined}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                selected === index
                  ? "border-[var(--color-teal-500)]"
                  : "border-transparent hover:border-border"
              )}
            >
              <Image
                src={getListingImageUrl(image.storage_path)}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
