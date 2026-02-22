import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WashGo | Washer & Dryer Rentals",
  description:
    "Premium washer and dryer rentals, delivered and installed. Starting at $49/mo with free repairs. Skip the laundromat forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
