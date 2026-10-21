import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic"; // always read fresh numbers

// Dashboard: server component, queries the database directly.
export default async function Dashboard() {
  const availableDevices = await db.device.count({ where: { status: "AVAILABLE" } });
  const activeRentals = await db.rental.count({ where: { status: "ACTIVE" } });
  const unpaidInvoices = await db.invoice.count({ where: { status: "UNPAID" } });
  const revenue = await db.invoice.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  // [label, value, accent color, link to the related page]
  const cards = [
    ["Available devices", availableDevices, "border-emerald-500", "/inventory"],
    ["Active rentals", activeRentals, "border-blue-600", "/rentals"],
    ["Unpaid invoices", unpaidInvoices, "border-amber-500", "/billing"],
    ["Total revenue (IDR)", (revenue._sum.amount ?? 0).toLocaleString("id-ID"), "border-slate-700", "/billing"],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mb-6 text-slate-500">Overview of devices, rentals and revenue.</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(([label, value, accent, href]) => (
          <Link key={label} href={href} className={`card border-l-4 ${accent} transition-transform hover:-translate-y-0.5`}>
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-1 text-3xl font-bold">{value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
