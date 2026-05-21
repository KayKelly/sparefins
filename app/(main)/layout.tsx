import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavUserMenu from "./NavUserMenu";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="mr-2 text-lg font-semibold tracking-tight text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]"
          >
            Sparefins
          </Link>

          <div className="flex items-center gap-1 text-sm">
            <Link
              href="/fins"
              className="rounded-md px-3 py-1.5 text-[var(--color-foreground)] hover:bg-[var(--color-sand-100)] hover:text-[var(--color-teal-600)]"
            >
              Fins
            </Link>
            <Link
              href="/boards"
              className="rounded-md px-3 py-1.5 text-[var(--color-foreground)] hover:bg-[var(--color-sand-100)] hover:text-[var(--color-teal-600)]"
            >
              Boards
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/listings/new"
              className="rounded-md bg-[var(--color-accent)] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
            >
              Sell
            </Link>
            <NavUserMenu user={user} />
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-8 text-sm text-muted-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-[var(--color-teal-600)]">Sparefins</p>
            <p>Second-hand surf fins and boards in New Zealand.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
