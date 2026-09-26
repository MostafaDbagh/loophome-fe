import type { Metadata } from "next";
import { Cairo, Geist } from "next/font/google";
import "../globals.css";
import { AdminShell } from "./AdminShell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], preload: false });
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"], display: "optional" });

// Private area: never indexed (next.config also sends X-Robots-Tag on /admin).
export const metadata: Metadata = {
  title: "HomeLoop Admin",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${geistSans.variable} ${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
