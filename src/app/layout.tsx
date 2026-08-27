import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "A Boy Who Faked His Smile | Sad Person",
  description:
    "A story of love, distance, and broken trust. Order the paperback of 'A Boy Who Faked His Smile' by Sad Person, direct from the author, with secure Razorpay checkout.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-100 text-stone-950 antialiased">{children}</body>
    </html>
  );
}
