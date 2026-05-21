-- ============================================================
-- ROW-LEVEL SECURITY
-- Principle: anyone can read active listings; only owners can mutate.
-- Safe to re-run: drops existing policies before recreating them.
-- ============================================================

alter table listings enable row level security;
alter table fin_details enable row level security;
alter table board_details enable row level security;
alter table listing_images enable row level security;
alter table messages enable row level security;
alter table wanted_posts enable row level security;

-- ------------------------------------------------------------
-- LISTINGS
-- ------------------------------------------------------------
drop policy if exists "listings_select_active" on listings;
create policy "listings_select_active"
  on listings for select
  using (status = 'active');

drop policy if exists "listings_select_own" on listings;
create policy "listings_select_own"
  on listings for select
  using (user_id = auth.uid());

drop policy if exists "listings_insert_own" on listings;
create policy "listings_insert_own"
  on listings for insert
  with check (user_id = auth.uid());

drop policy if exists "listings_update_own" on listings;
create policy "listings_update_own"
  on listings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "listings_delete_own" on listings;
create policy "listings_delete_own"
  on listings for delete
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- FIN DETAILS
-- ------------------------------------------------------------
drop policy if exists "fin_details_select" on fin_details;
create policy "fin_details_select"
  on fin_details for select
  using (
    exists (
      select 1 from listings
      where listings.id = fin_details.listing_id
        and (listings.status = 'active' or listings.user_id = auth.uid())
    )
  );

drop policy if exists "fin_details_insert_own" on fin_details;
create policy "fin_details_insert_own"
  on fin_details for insert
  with check (
    exists (
      select 1 from listings
      where listings.id = fin_details.listing_id
        and listings.user_id = auth.uid()
    )
  );

drop policy if exists "fin_details_update_own" on fin_details;
create policy "fin_details_update_own"
  on fin_details for update
  using (
    exists (
      select 1 from listings
      where listings.id = fin_details.listing_id
        and listings.user_id = auth.uid()
    )
  );

drop policy if exists "fin_details_delete_own" on fin_details;
create policy "fin_details_delete_own"
  on fin_details for delete
  using (
    exists (
      select 1 from listings
      where listings.id = fin_details.listing_id
        and listings.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- BOARD DETAILS
-- ------------------------------------------------------------
drop policy if exists "board_details_select" on board_details;
create policy "board_details_select"
  on board_details for select
  using (
    exists (
      select 1 from listings
      where listings.id = board_details.listing_id
        and (listings.status = 'active' or listings.user_id = auth.uid())
    )
  );

drop policy if exists "board_details_insert_own" on board_details;
create policy "board_details_insert_own"
  on board_details for insert
  with check (
    exists (
      select 1 from listings
      where listings.id = board_details.listing_id
        and listings.user_id = auth.uid()
    )
  );

drop policy if exists "board_details_update_own" on board_details;
create policy "board_details_update_own"
  on board_details for update
  using (
    exists (
      select 1 from listings
      where listings.id = board_details.listing_id
        and listings.user_id = auth.uid()
    )
  );

drop policy if exists "board_details_delete_own" on board_details;
create policy "board_details_delete_own"
  on board_details for delete
  using (
    exists (
      select 1 from listings
      where listings.id = board_details.listing_id
        and listings.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- LISTING IMAGES
-- ------------------------------------------------------------
drop policy if exists "listing_images_select" on listing_images;
create policy "listing_images_select"
  on listing_images for select
  using (
    exists (
      select 1 from listings
      where listings.id = listing_images.listing_id
        and (listings.status = 'active' or listings.user_id = auth.uid())
    )
  );

drop policy if exists "listing_images_insert_own" on listing_images;
create policy "listing_images_insert_own"
  on listing_images for insert
  with check (
    exists (
      select 1 from listings
      where listings.id = listing_images.listing_id
        and listings.user_id = auth.uid()
    )
  );

drop policy if exists "listing_images_delete_own" on listing_images;
create policy "listing_images_delete_own"
  on listing_images for delete
  using (
    exists (
      select 1 from listings
      where listings.id = listing_images.listing_id
        and listings.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- MESSAGES
-- ------------------------------------------------------------
drop policy if exists "messages_select_participant" on messages;
create policy "messages_select_participant"
  on messages for select
  using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists "messages_insert_own" on messages;
create policy "messages_insert_own"
  on messages for insert
  with check (from_user = auth.uid());

drop policy if exists "messages_update_read_at" on messages;
create policy "messages_update_read_at"
  on messages for update
  using (to_user = auth.uid())
  with check (to_user = auth.uid());

-- ------------------------------------------------------------
-- WANTED POSTS
-- ------------------------------------------------------------
drop policy if exists "wanted_posts_select_active" on wanted_posts;
create policy "wanted_posts_select_active"
  on wanted_posts for select
  using (status = 'active');

drop policy if exists "wanted_posts_select_own" on wanted_posts;
create policy "wanted_posts_select_own"
  on wanted_posts for select
  using (user_id = auth.uid());

drop policy if exists "wanted_posts_insert_own" on wanted_posts;
create policy "wanted_posts_insert_own"
  on wanted_posts for insert
  with check (user_id = auth.uid());

drop policy if exists "wanted_posts_update_own" on wanted_posts;
create policy "wanted_posts_update_own"
  on wanted_posts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "wanted_posts_delete_own" on wanted_posts;
create policy "wanted_posts_delete_own"
  on wanted_posts for delete
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- STORAGE
-- Run after creating the "listing-images" bucket in the dashboard.
-- The bucket insert is also idempotent via ON CONFLICT DO NOTHING.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('listing-images', 'listing-images', true)
  on conflict (id) do nothing;

drop policy if exists "listing_images_storage_select" on storage.objects;
create policy "listing_images_storage_select"
  on storage.objects for select
  using (bucket_id = 'listing-images');

drop policy if exists "listing_images_storage_insert" on storage.objects;
create policy "listing_images_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing_images_storage_delete" on storage.objects;
create policy "listing_images_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
