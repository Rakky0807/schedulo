/**
 * app/layout.js
 * Root layout — sets up font, metadata, and session provider.
 */

import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: {
    default: "Schedulo — Smart Scheduling",
    template: "%s | Schedulo",
  },
  description:
    "Schedule meetings effortlessly. Share your availability, let others book time with you — no back-and-forth.",
  keywords: ["scheduling", "calendar", "meetings", "appointments", "booking"],
  openGraph: {
    title: "Schedulo",
    description: "Smart scheduling made simple.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
