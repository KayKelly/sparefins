import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import FinIcon from "@/components/icons/FinIcon";
import SurfboardIcon from "@/components/icons/SurfboardIcon";

export const metadata: Metadata = {
  title: "Sparefins — Second-hand surf fins and boards in New Zealand",
};

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[min(520px,72vh)] overflow-hidden border-b border-[var(--color-border)]">
        <Image
          src="/images/hero-raglan.jpg"
          alt="Waves at Raglan, New Zealand"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />

        <div className="relative mx-auto flex min-h-[min(520px,72vh)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-20">

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Lost a fin?{" "}
            <span className="text-[var(--color-teal-300)]">
              Find the replacement you need.
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/85">
            New Zealand&apos;s marketplace for second-hand fins and boards.
            Filter by system, size, and position to find exactly what you need.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/fins"
              className="w-full rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--color-accent-hover)] sm:w-auto"
            >
              Browse fins
            </Link>
            <Link
              href="/listings/new"
              className="w-full rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
            >
              Sell a fin
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/50">Photo: <Link href="https://www.instagram.com/surfgirlnz/" target="_blank">@surfgirlnz</Link></p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-semibold">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Tell us what you need",
                body: "Select your board setup and which fin you're missing. We translate that into the right search filters.",
              },
              {
                step: "2",
                title: "Browse matched listings",
                body: "See fins that actually fit your board. No more scrolling through full sets you can't use.",
              },
              {
                step: "3",
                title: "Message the seller",
                body: "Contact them directly. Sort payment however suits you both. No platform fees.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-100)] text-sm font-bold text-[var(--color-teal-700)]">
                  {step}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/fins"
              className="group rounded-xl border border-[var(--color-border)] p-6 hover:border-[var(--color-teal-300)] hover:bg-[var(--color-teal-50)]"
            >
              <FinIcon size={40} className="mb-3 text-[var(--color-teal-500)] group-hover:text-[var(--color-teal-600)]" />
              <h3 className="mb-1 text-lg font-semibold group-hover:text-[var(--color-teal-600)]">
                Fins
              </h3>
              <p className="text-sm text-muted-foreground">
                FCS, FCS II, Futures. Single, thruster, quad. Filter to exactly
                what fits your box.
              </p>
            </Link>
            <Link
              href="/boards"
              className="group rounded-xl border border-[var(--color-border)] p-6 hover:border-[var(--color-teal-300)] hover:bg-[var(--color-teal-50)]"
            >
              <SurfboardIcon size={40} className="mb-3 text-[var(--color-teal-500)] group-hover:text-[var(--color-teal-600)]" />
              <h3 className="mb-1 text-lg font-semibold group-hover:text-[var(--color-teal-600)]">
                Boards
              </h3>
              <p className="text-sm text-muted-foreground">
                Shortboards, fish, mid-lengths, longboards. Filter by length,
                volume, and fin setup.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
