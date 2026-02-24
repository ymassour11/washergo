import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/i18n";

export const metadata: Metadata = {
  title: "GoWash | Washer & Dryer Rentals",
  description:
    "Premium washer and dryer rentals, delivered and installed. Starting at $49/mo with free repairs. Skip the laundromat forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
