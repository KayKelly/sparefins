-- Enable extensions we'll need
create extension if not exists "uuid-ossp";

-- ============================================================
-- LISTINGS (base table, shared across all categories)
-- ============================================================
create table listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  category text not null check (category in ('fin', 'board', 'wetsuit')),
  title text not null,
  description text,
  price_nzd numeric(10, 2),
  condition text not null check (condition in ('new', 'like_new', 'used_light', 'used_visible', 'repaired')),
  location_lat numeric(9, 6),
  location_lng numeric(9, 6),
  location_label text, -- e.g. "Raglan, Waikato"
  status text not null default 'active' check (status in ('active', 'sold', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_category_status_idx on listings (category, status);
create index listings_user_id_idx on listings (user_id);
create index listings_created_at_idx on listings (created_at desc);

-- ============================================================
-- FIN DETAILS
-- ============================================================
create table fin_details (
  listing_id uuid primary key references listings on delete cascade,
  system text not null check (system in ('fcs', 'fcs2', 'futures', 'single_tab', 'longboard_box', 'other')),
  brand text,
  model text,
  size_bucket text check (size_bucket in ('xs', 's', 'm', 'l', 'xl')),
  position text check (position in ('front', 'rear', 'center', 'side_bite')),
  side text not null default 'na' check (side in ('left', 'right', 'na')),
  quantity int not null default 1 check (quantity > 0)
);

create index fin_details_system_idx on fin_details (system);
create index fin_details_position_side_idx on fin_details (position, side);
create index fin_details_size_bucket_idx on fin_details (size_bucket);

-- ============================================================
-- BOARD DETAILS
-- ============================================================
create table board_details (
  listing_id uuid primary key references listings on delete cascade,
  length_inches numeric(5, 2),
  volume_litres numeric(5, 1),
  board_type text check (board_type in ('shortboard', 'fish', 'mid_length', 'longboard', 'gun', 'sup', 'other')),
  fin_setup text check (fin_setup in ('single', 'twin', 'thruster', 'quad', 'two_plus_one', 'five_fin')),
  fin_system text check (fin_system in ('fcs', 'fcs2', 'futures', 'glassed_in', 'other'))
);

-- ============================================================
-- LISTING IMAGES
-- ============================================================
create table listing_images (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings on delete cascade,
  storage_path text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index listing_images_listing_id_idx on listing_images (listing_id, display_order);

-- ============================================================
-- MESSAGES
-- ============================================================
create table messages (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings,
  from_user uuid not null references auth.users,
  to_user uuid not null references auth.users,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_to_user_idx on messages (to_user, created_at desc);
create index messages_from_user_idx on messages (from_user, created_at desc);
create index messages_listing_id_idx on messages (listing_id);

-- ============================================================
-- WANTED POSTS
-- Buyers post what they're looking for; sellers get notified of matches
-- ============================================================
create table wanted_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  category text not null check (category in ('fin', 'board')),
  description text,
  -- Fin-specific filters (nullable, only set when category = 'fin')
  fin_system text check (fin_system in ('fcs', 'fcs2', 'futures', 'single_tab', 'longboard_box', 'other')),
  fin_size_bucket text check (fin_size_bucket in ('xs', 's', 'm', 'l', 'xl')),
  fin_position text check (fin_position in ('front', 'rear', 'center', 'side_bite')),
  fin_side text check (fin_side in ('left', 'right', 'na')),
  max_price_nzd numeric(10, 2),
  location_label text,
  status text not null default 'active' check (status in ('active', 'filled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index wanted_posts_user_id_idx on wanted_posts (user_id);
create index wanted_posts_category_status_idx on wanted_posts (category, status);

-- ============================================================
-- UPDATED_AT trigger (keeps listings.updated_at current)
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on listings
  for each row execute function set_updated_at();
