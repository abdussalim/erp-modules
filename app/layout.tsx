import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "JavaMifi ERP",
  description: "ERP for MiFi rental",
};

const links = [
  ["/", "Dashboard"],
  ["/inventory", "Inventory"],
  ["/customers", "Customers"],
  ["/rentals", "Rentals"],
  ["/billing", "Billing"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <nav className="flex gap-6 bg-blue-700 px-6 py-3 text-white">
          <span className="font-bold">JavaMifi ERP</span>
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:underline">
              {label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </body>
    </html>
  );
}
