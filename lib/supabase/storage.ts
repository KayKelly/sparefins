const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export function getListingImageUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/listing-images/${storagePath}`
}
