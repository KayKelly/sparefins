"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  FIN_SYSTEMS,
  FIN_SIZES,
  FIN_POSITIONS,
  FIN_SIDES,
  CONDITIONS,
} from "@/lib/constants";

export interface CreateListingState {
  errors: Record<string, string>;
}

export interface UpdateListingState {
  errors: Record<string, string>;
}

const FIN_SYSTEM_VALUES = FIN_SYSTEMS.map((s) => s.value);
const FIN_SIZE_VALUES = FIN_SIZES.map((s) => s.value);
const FIN_POSITION_VALUES = FIN_POSITIONS.map((s) => s.value);
const FIN_SIDE_VALUES = FIN_SIDES.map((s) => s.value);
const CONDITION_VALUES = CONDITIONS.map((c) => c.value);

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null) ?? "";
}

export async function createListing(
  _prev: CreateListingState,
  formData: FormData
): Promise<CreateListingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errors: { _form: "You must be signed in to create a listing." } };
  }

  // ── Extract fields ────────────────────────────────────────────────────────
  const title = str(formData, "title").trim();
  const description = str(formData, "description").trim() || null;
  const priceRaw = str(formData, "price_nzd").trim();
  const condition = str(formData, "condition");
  const locationLabel = str(formData, "location_label");

  const system = str(formData, "system");
  const brand = str(formData, "brand").trim() || null;
  const model = str(formData, "model").trim() || null;
  const sizeBucket = str(formData, "size_bucket") || null;
  const position = str(formData, "position") || null;
  const side = str(formData, "side") || "na";
  const quantityRaw = str(formData, "quantity");
  const images = formData.getAll("images") as File[];

  // ── Validate ──────────────────────────────────────────────────────────────
  const errors: Record<string, string> = {};

  if (!title) errors.title = "Title is required.";
  if (!system || !FIN_SYSTEM_VALUES.includes(system as never))
    errors.system = "Select a fin system.";
  if (!condition || !CONDITION_VALUES.includes(condition as never))
    errors.condition = "Select a condition.";
  if (!locationLabel) errors.location_label = "Select a region.";

  if (sizeBucket && !FIN_SIZE_VALUES.includes(sizeBucket as never))
    errors.size_bucket = "Invalid size.";
  if (position && !FIN_POSITION_VALUES.includes(position as never))
    errors.position = "Invalid position.";
  if (!FIN_SIDE_VALUES.includes(side as never))
    errors.side = "Invalid side value.";

  const priceNzd = priceRaw ? parseFloat(priceRaw) : null;
  if (priceRaw && (isNaN(priceNzd!) || priceNzd! < 0))
    errors.price_nzd = "Enter a valid price.";

  const quantity = quantityRaw ? parseInt(quantityRaw, 10) : 1;
  if (isNaN(quantity) || quantity < 1 || quantity > 10)
    errors.quantity = "Quantity must be between 1 and 10.";

  const validImages = images.filter((f) => f.size > 0);
  if (validImages.length > 5) errors.images = "Maximum 5 photos.";

  if (Object.keys(errors).length > 0) return { errors };

  // ── Insert listing ────────────────────────────────────────────────────────
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      category: "fin",
      title,
      description,
      price_nzd: priceNzd,
      condition,
      location_label: locationLabel,
      status: "active",
    })
    .select("id")
    .single();

  if (listingError || !listing) {
    console.error("listings insert error:", listingError);
    return { errors: { _form: "Failed to create listing. Please try again." } };
  }

  // ── Insert fin_details ────────────────────────────────────────────────────
  const { error: finError } = await supabase.from("fin_details").insert({
    listing_id: listing.id,
    system,
    brand,
    model,
    size_bucket: sizeBucket,
    position,
    side,
    quantity,
  });

  if (finError) {
    console.error("fin_details insert error:", finError);
    await supabase.from("listings").delete().eq("id", listing.id);
    return {
      errors: { _form: "Failed to save fin details. Please try again." },
    };
  }

  // ── Upload images ─────────────────────────────────────────────────────────
  for (let i = 0; i < validImages.length; i++) {
    const file = validImages[i];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const storagePath = `${user.id}/${listing.id}/${i}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      console.error(`Image ${i} upload error:`, uploadError);
      continue; // Don't block listing creation for a failed image
    }

    await supabase.from("listing_images").insert({
      listing_id: listing.id,
      storage_path: storagePath,
      display_order: i,
    });
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  revalidatePath("/fins");
  redirect(`/fins/${listing.id}`);
}

// ── Update listing ─────────────────────────────────────────────────────────
// Usage: updateListing.bind(null, id) → passes id as first arg, leaving
// (prevState, formData) signature that useActionState expects.

export async function updateListing(
  id: string,
  _prev: UpdateListingState,
  formData: FormData
): Promise<UpdateListingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errors: { _form: "You must be signed in to edit a listing." } };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("listings")
    .select("user_id, category")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return { errors: { _form: "Listing not found or you don't have permission to edit it." } };
  }

  // ── Extract fields ────────────────────────────────────────────────────────
  const title = str(formData, "title").trim();
  const description = str(formData, "description").trim() || null;
  const priceRaw = str(formData, "price_nzd").trim();
  const condition = str(formData, "condition");
  const locationLabel = str(formData, "location_label");

  const system = str(formData, "system");
  const brand = str(formData, "brand").trim() || null;
  const model = str(formData, "model").trim() || null;
  const sizeBucket = str(formData, "size_bucket") || null;
  const position = str(formData, "position") || null;
  const side = str(formData, "side") || "na";
  const quantityRaw = str(formData, "quantity");

  // ── Validate ──────────────────────────────────────────────────────────────
  const errors: Record<string, string> = {};

  if (!title) errors.title = "Title is required.";
  if (!system || !FIN_SYSTEM_VALUES.includes(system as never))
    errors.system = "Select a fin system.";
  if (!condition || !CONDITION_VALUES.includes(condition as never))
    errors.condition = "Select a condition.";
  if (!locationLabel) errors.location_label = "Select a region.";

  if (sizeBucket && !FIN_SIZE_VALUES.includes(sizeBucket as never))
    errors.size_bucket = "Invalid size.";
  if (position && !FIN_POSITION_VALUES.includes(position as never))
    errors.position = "Invalid position.";
  if (!FIN_SIDE_VALUES.includes(side as never))
    errors.side = "Invalid side value.";

  const priceNzd = priceRaw ? parseFloat(priceRaw) : null;
  if (priceRaw && (isNaN(priceNzd!) || priceNzd! < 0))
    errors.price_nzd = "Enter a valid price.";

  const quantity = quantityRaw ? parseInt(quantityRaw, 10) : 1;
  if (isNaN(quantity) || quantity < 1 || quantity > 10)
    errors.quantity = "Quantity must be between 1 and 10.";

  if (Object.keys(errors).length > 0) return { errors };

  // ── Update listing ────────────────────────────────────────────────────────
  const { error: listingError } = await supabase
    .from("listings")
    .update({
      title,
      description,
      price_nzd: priceNzd,
      condition,
      location_label: locationLabel,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (listingError) {
    console.error("listings update error:", listingError);
    return { errors: { _form: "Failed to update listing. Please try again." } };
  }

  // ── Update fin_details ────────────────────────────────────────────────────
  const { error: finError } = await supabase
    .from("fin_details")
    .update({ system, brand, model, size_bucket: sizeBucket, position, side, quantity })
    .eq("listing_id", id);

  if (finError) {
    console.error("fin_details update error:", finError);
    return { errors: { _form: "Failed to update fin details. Please try again." } };
  }

  revalidatePath(`/fins/${id}`);
  revalidatePath("/fins");
  revalidatePath("/listings/mine");
  redirect(`/fins/${id}`);
}

// ── Mark listing status ────────────────────────────────────────────────────
// Usage: markListingStatus.bind(null, id) → form action with hidden status input.

export async function markListingStatus(
  id: string,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const status = formData.get("status") as string;
  if (!["active", "sold", "paused"].includes(status)) return;

  await supabase
    .from("listings")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/listings/mine");
  revalidatePath(`/fins/${id}`);
  revalidatePath("/fins");
}
