import { createBrowserClient } from '@supabase/ssr'

// Singleton — safe to call multiple times in Client Components.
// The library handles isSingleton internally when no custom cookies are passed.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
