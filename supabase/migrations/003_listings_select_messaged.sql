-- Allow participants in a message thread to read listing metadata (title, images)
-- even after a listing is sold or paused.

drop policy if exists "listings_select_messaged" on listings;
create policy "listings_select_messaged"
  on listings for select
  using (
    exists (
      select 1 from messages
      where messages.listing_id = listings.id
        and (messages.from_user = auth.uid() or messages.to_user = auth.uid())
    )
  );
