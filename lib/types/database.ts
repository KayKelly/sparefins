// Manually maintained until we wire up `supabase gen types`.
// Run: supabase gen types typescript --local > lib/types/database.ts
// after `supabase start` to get the auto-generated version.

export type ListingCategory = 'fin' | 'board' | 'wetsuit'
export type ListingStatus = 'active' | 'sold' | 'paused'
export type ListingCondition = 'new' | 'like_new' | 'used_light' | 'used_visible' | 'repaired'

export type FinSystem = 'fcs' | 'fcs2' | 'futures' | 'single_tab' | 'longboard_box' | 'other'
export type FinSizeBucket = 'xs' | 's' | 'm' | 'l' | 'xl'
export type FinPosition = 'front' | 'rear' | 'center' | 'side_bite'
export type FinSide = 'left' | 'right' | 'na'

export type BoardType = 'shortboard' | 'fish' | 'mid_length' | 'longboard' | 'gun' | 'sup' | 'other'
export type BoardFinSetup = 'single' | 'twin' | 'thruster' | 'quad' | 'two_plus_one' | 'five_fin'
export type BoardFinSystem = 'fcs' | 'fcs2' | 'futures' | 'glassed_in' | 'other'

export interface Listing {
  id: string
  user_id: string
  category: ListingCategory
  title: string
  description: string | null
  price_nzd: number | null
  condition: ListingCondition
  location_lat: number | null
  location_lng: number | null
  location_label: string | null
  status: ListingStatus
  created_at: string
  updated_at: string
}

export interface FinDetails {
  listing_id: string
  system: FinSystem
  brand: string | null
  model: string | null
  size_bucket: FinSizeBucket | null
  position: FinPosition | null
  side: FinSide
  quantity: number
}

export interface BoardDetails {
  listing_id: string
  length_inches: number | null
  volume_litres: number | null
  board_type: BoardType | null
  fin_setup: BoardFinSetup | null
  fin_system: BoardFinSystem | null
}

export interface ListingImage {
  id: string
  listing_id: string
  storage_path: string
  display_order: number
  created_at: string
}

export interface Message {
  id: string
  listing_id: string
  from_user: string
  to_user: string
  body: string
  created_at: string
  read_at: string | null
}

export interface WantedPost {
  id: string
  user_id: string
  category: ListingCategory
  description: string | null
  fin_system: FinSystem | null
  fin_size_bucket: FinSizeBucket | null
  fin_position: FinPosition | null
  fin_side: FinSide | null
  max_price_nzd: number | null
  location_label: string | null
  status: 'active' | 'filled' | 'expired'
  created_at: string
  expires_at: string | null
}

// Joined shapes used in queries
export interface FinListing extends Listing {
  category: 'fin'
  fin_details: FinDetails
  listing_images: ListingImage[]
}

export interface BoardListing extends Listing {
  category: 'board'
  board_details: BoardDetails
  listing_images: ListingImage[]
}
