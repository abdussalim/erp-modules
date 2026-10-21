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
      <body className="flex min-h-screen flex-col bg-slate-100 text-slate-900 lg:flex-row">
        {/* Top bar on small screens, sidebar on large screens */}
        <nav className="flex shrink-0 flex-wrap items-center gap-1 bg-slate-900 p-4 text-slate-300 lg:w-56 lg:flex-col lg:items-stretch">
          <div className="mr-4 px-3 lg:mr-0 lg:mb-6">
            <div className="text-lg font-bold text-white">JavaMifi ERP</div>
            <div className="text-xs text-slate-400">MiFi Rental Management</div>
          </div>
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl overflow-x-auto p-8">{children}</main>
      </body>
    </html>
  );
}
