import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageTransition } from "@/components/motion/page-transition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "REZFLIX Hub",
  description: "The single entry point for the REZFLIX media service.",
};

// Dark-only: tell the browser (and mobile UI chrome) we're a dark surface so the mobile
// address bar matches the app, not a white flash. theme-color can't consume oklch, so this
// is the sRGB of --background (oklch(0.16 0.005 270) -> #0c0d0f); re-derive if that token moves.
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0c0d0f",
  width: "device-width",
  initialScale: 1,
};

// Dark-only app: `dark` is hardcoded on <html>; there is no theme toggle.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-svh flex flex-col">
        <SiteHeader />
        {/* Content area grows so the footer is pushed to the bottom on short pages.
            PageTransition adds a reduced-motion-aware enter animation on route change. */}
        <PageTransition>{children}</PageTransition>
        <SiteFooter />
        {/* Dark-only app: pin Sonner to the dark theme (no next-themes here). */}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
