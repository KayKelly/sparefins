"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  BOARD_TYPES,
  BOARD_FIN_SETUPS,
  BOARD_FIN_SYSTEMS,
  CONDITIONS,
} from "@/lib/constants";

export interface CreateBoardListingState {
  errors: Record<string, string>;
}

const BOARD_TYPE_VALUES = BOARD_TYPES.map((t) => t.value);
const FIN_SETUP_VALUES = BOARD_FIN_SETUPS.map((s) => s.value);
const FIN_SYSTEM_VALUES = BOARD_FIN_SYSTEMS.map((s) => s.value);
const CONDITION_VALUES = CONDITIONS.map((c) => c.value);

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null) ?? "";
}

export async function createBoardListing(
  _prev: CreateBoardListingState,
  formData: FormData
): Promise<CreateBoardListingState> {
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

  const boardType = str(formData, "board_type") || null;
  const finSetup = str(formData, "fin_setup") || null;
  const finSystem = str(formData, "fin_system") || null;

  const feetRaw = str(formData, "length_feet").trim();
  const inchesRaw = str(formData, "length_inches_rem").trim();
  const volumeRaw = str(formData, "volume_litres").trim();

  const images = formData.getAll("images") as File[];

  // ── Validate ──────────────────────────────────────────────────────────────
  const errors: Record<string, string> = {};

  if (!title) errors.title = "Title is required.";
  if (!condition || !CONDITION_VALUES.includes(condition as never))
    errors.condition = "Select a condition.";
  if (!locationLabel) errors.location_label = "Select a region.";

  if (boardType && !BOARD_TYPE_VALUES.includes(boardType as never))
    errors.board_type = "Invalid board type.";
  if (finSetup && !FIN_SETUP_VALUES.includes(finSetup as never))
    errors.fin_setup = "Invalid fin setup.";
  if (finSystem && !FIN_SYSTEM_VALUES.includes(finSystem as never))
    errors.fin_system = "Invalid fin system.";

  const priceNzd = priceRaw ? parseFloat(priceRaw) : null;
  if (priceRaw && (isNaN(priceNzd!) || priceNzd! < 0))
    errors.price_nzd = "Enter a valid price.";

  // Length: feet required if inches provided; convert to total inches
  let lengthInches: number | null = null;
  if (feetRaw) {
    const feet = parseInt(feetRaw, 10);
    const rem = inchesRaw ? parseInt(inchesRaw, 10) : 0;
    if (isNaN(feet) || feet < 0 || feet > 20)
      errors.length_feet = "Enter a valid length (feet).";
    else if (isNaN(rem) || rem < 0 || rem > 11)
      errors.length_inches_rem = "Inches must be 0–11.";
    else lengthInches = feet * 12 + rem;
  }

  const volumeLitres = volumeRaw ? parseFloat(volumeRaw) : null;
  if (volumeRaw && (isNaN(volumeLitres!) || volumeLitres! <= 0))
    errors.volume_litres = "Enter a valid volume.";

  const validImages = images.filter((f) => f.size > 0);
  if (validImages.length > 5) errors.images = "Maximum 5 photos.";

  if (Object.keys(errors).length > 0) return { errors };

  // ── Insert listing ────────────────────────────────────────────────────────
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      category: "board",
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

  // ── Insert board_details ──────────────────────────────────────────────────
  const { error: boardError } = await supabase.from("board_details").insert({
    listing_id: listing.id,
    board_type: boardType,
    fin_setup: finSetup,
    fin_system: finSystem,
    length_inches: lengthInches,
    volume_litres: volumeLitres,
  });

  if (boardError) {
    console.error("board_details insert error:", boardError);
    await supabase.from("listings").delete().eq("id", listing.id);
    return {
      errors: { _form: "Failed to save board details. Please try again." },
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
      continue;
    }

    await supabase.from("listing_images").insert({
      listing_id: listing.id,
      storage_path: storagePath,
      display_order: i,
    });
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  revalidatePath("/boards");
  redirect(`/boards/${listing.id}`);
}
