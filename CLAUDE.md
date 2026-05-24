@AGENTS.md

# Sparefins — Project Context

## What this is
Niche marketplace for second-hand surf fins, surfboards, and eventually wetsuits. NZ-focused to start. Core insight: surfers lose a single fin from a set, but surf shops only sell full sets. Sparefins lets people sell spares to someone who needs to complete a set.

The killer feature vs Facebook Marketplace / TradeMe: structured filtering on fin attributes (system, size, position, side). Someone who lost their FCS II right-rear medium can filter to exactly that.

## Stack
- **Next.js 16 (App Router)** on Vercel
- **Supabase** (Postgres, Auth, Storage) — cloud project
- **Tailwind v4** + **shadcn/ui** (Nova theme, neutral base, teal primary override)
- TypeScript throughout

## Key architectural decisions made
- Route groups: `(auth)/` for login/callback (no nav shell), `(main)/` for everything else
- Supabase clients: `lib/supabase/server.ts` (Server Components + Actions), `lib/supabase/browser.ts` (Client Components only). Never import the server client from a `'use client'` file.
- Server Actions live in `app/actions/` as dedicated `'use server'` files — not inlined in components
- `middleware.ts` at root handles session refresh on every request (critical — don't remove)
- DB types are manually maintained in `lib/types/database.ts` until `supabase gen types` is wired up
- Shared constants (fin systems, sizes, conditions, NZ regions) live in `lib/constants.ts`
- Image storage: Supabase Storage bucket `listing-images`, path pattern `{userId}/{listingId}/{i}-{timestamp}.{ext}`. Public bucket. RLS in storage schema.
- No on-platform payments in v1. Buyers message sellers, sort payment themselves.
- Dark mode not implemented — single light theme for now.

## Colour system
Tailwind v4 `@theme` with teal/sand brand palette. shadcn variables wired to brand in `:root`:
- `--primary` → teal-600 (shadcn Button default variant renders teal)
- `--accent` → teal-500
- `--background` → sand-50
- Use `text-muted-foreground` for secondary text (NOT `text-[var(--color-muted)]` — shadcn's `--muted` is a background colour)
- Use `var(--color-teal-*)` and `var(--color-sand-*)` directly for brand-specific colour
- `var(--color-surface)` = #fff, `var(--color-accent-hover)` = teal-600 (tokens not in shadcn)

## Auth
Magic link only (no password). `sendMagicLink` server action → `supabase.auth.signInWithOtp()` → email redirect to `/auth/callback` → `exchangeCodeForSession` → redirect home. Set site URL and redirect URLs in Supabase dashboard > Authentication > URL Configuration.

## Data model key insight
**Setup (thruster/quad etc.) belongs on the board, not the fin.** A fin doesn't have a setup. The setup concept lives in the search UI, not the data. Side filter includes `side='na'` fins when left/right is selected (symmetric fins can fill either position).

## What's been built

### Infrastructure
- [x] `supabase/config.toml` — local dev config (needs Docker)
- [x] `supabase/migrations/001_schema.sql` — all tables: listings, fin_details, board_details, listing_images, messages, wanted_posts
- [x] `supabase/migrations/002_rls.sql` — full RLS policies + storage bucket creation (idempotent, safe to re-run)
- [x] `middleware.ts` — Supabase session refresh

### Auth
- [x] `app/(auth)/login/page.tsx` + `LoginForm.tsx` — magic link form with `useActionState`
- [x] `app/(auth)/auth/callback/route.ts` — PKCE code exchange
- [x] `app/actions/auth.ts` — `sendMagicLink` server action

### Navigation & layout
- [x] `app/(main)/layout.tsx` — sticky nav with Sell CTA, footer
- [x] `app/(main)/NavUserMenu.tsx` — avatar initials dropdown, sign out

### Home page
- [x] `app/(main)/page.tsx` — hero, how-it-works, category cards

### Listing creation
- [x] `app/actions/listings.ts` — `createListing` server action: validates, inserts listings + fin_details, uploads images, redirects to `/fins/{id}`
- [x] `app/(main)/listings/new/page.tsx` — auth-guarded, redirects to login with `?next=` if unauthenticated
- [x] `app/(main)/listings/new/FinListingForm.tsx` — full form: fin attributes (system/size/position/side/quantity/brand/model), title auto-generation from attributes, description, condition, price, location region, image upload with client-side preview (uses DataTransfer to inject files into FormData)

### Browse page
- [x] `app/(main)/fins/page.tsx` — server-rendered, reads `searchParams` (Promise in Next 16), fetches from Supabase with `fin_details!inner` join, side filter includes `na` when left/right selected
- [x] `app/(main)/fins/FinFilters.tsx` — client component, URL-driven filters via `router.replace`, `useTransition` for pending state
- [x] `app/(main)/fins/FinCard.tsx` — listing card with cover image, system/size/position/side/condition badges
- [x] `lib/supabase/storage.ts` — `getListingImageUrl(path)` helper

### Listing detail
- [x] `app/(main)/fins/[id]/page.tsx` — SSR detail page: image gallery, fin specs, condition, price, location, `generateMetadata` for SEO + OG
- [x] `app/(main)/fins/[id]/FinImageGallery.tsx` — client image gallery with thumbnail strip
- [x] `app/(main)/fins/[id]/ContactSellerForm.tsx` — contact form for buyers; login prompt for guests; own-listing notice for sellers
- [x] `lib/fin-labels.ts` — display labels + badge colours for all fin enums

### Messaging
- [x] `app/(main)/messages/page.tsx` — auth-guarded inbox: threads grouped by listing + counterparty, unread badge
- [x] `app/(main)/messages/[listingId]/[otherUserId]/page.tsx` — single thread: chat bubbles, read-on-load, reply form
- [x] `app/(main)/messages/[listingId]/[otherUserId]/ReplyForm.tsx` — reply client component
- [x] `app/actions/messages.ts` — `sendMessage` server action; `markThreadRead` action
- [x] `lib/messages.ts` — `buildInboxThreads`, `MESSAGE_MAX_LENGTH`, `getUnreadMessageCount`

### Seller tools
- [x] `app/(main)/listings/mine/page.tsx` — My listings: own listing cards (fins + boards) with status badge, edit + mark-sold actions
- [x] `app/(main)/listings/[id]/edit/page.tsx` — auth-guarded edit page; ownership check (fins only)
- [x] `app/(main)/listings/[id]/edit/EditListingForm.tsx` — pre-filled edit form (all fields except images)
- [x] `app/actions/listings.ts` — `updateListing` (bound id, updates listings + fin_details, revalidates), `markListingStatus` (sold/active toggle)

### Board listings
- [x] `lib/board-labels.ts` — display labels + badge colours for board type, fin setup, fin system; `formatLength` helper (inches → feet'in")
- [x] `lib/constants.ts` — `BOARD_TYPES`, `BOARD_FIN_SETUPS`, `BOARD_FIN_SYSTEMS` added
- [x] `app/(main)/boards/page.tsx` — SSR browse with filters (board type, fin setup, fin system, condition, location)
- [x] `app/(main)/boards/BoardCard.tsx` — card with type badge, length overlay, fin setup + volume chips
- [x] `app/(main)/boards/BoardFilters.tsx` — client filter selects via URL params
- [x] `app/(main)/boards/[id]/page.tsx` — SSR detail page: image gallery, specs, contact seller, `generateMetadata`
- [x] `app/(main)/boards/new/page.tsx` — auth-guarded create page
- [x] `app/(main)/boards/new/BoardListingForm.tsx` — full create form: board type, fin setup/system, length (ft+in), volume, image upload, auto-title
- [x] `app/actions/boards.ts` — `createBoardListing` server action

## What's NOT built yet (next sessions)
- [ ] Edit board listing (no `/listings/[id]/edit` equivalent for boards yet)
- [ ] Image editing on existing listings (add/remove photos post-creation)
- [ ] Wanted posts (post + match notifications)
- [ ] Email notification when you receive a message (Supabase webhook → email)
- [ ] `supabase gen types` wired to CI/npm script

## Conventions
- No em dashes in user-facing copy
- `params` and `searchParams` are Promises in Next 16 — always `await` them
- Server Actions must call `supabase.auth.getUser()` (not `getSession()`) for auth checks
- Don't use `getSession()` for authorization — it's unverified
- shadcn components live in `components/ui/`, don't edit them directly
- Images from Supabase Storage: use `next/image` with the `getListingImageUrl()` helper
- Migrations are in `supabase/migrations/` as plain SQL. Make them idempotent (`drop policy if exists`, `on conflict do nothing`, `create or replace function`)
