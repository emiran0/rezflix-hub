import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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

// Dark-only app: `dark` is hardcoded on <html>; there is no theme toggle.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Dark-only app: pin Sonner to the dark theme (no next-themes here). */}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
