import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    template: "%s | Sparefins",
    default: "Sparefins — Second-hand surf fins and boards in New Zealand",
  },
  description:
    "Buy and sell second-hand surf fins and boards in New Zealand. Find the exact fin you need: FCS, FCS II, Futures. Filter by system, size, position and side.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.sparefins.com"
  ),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
