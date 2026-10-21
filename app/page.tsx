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

  const cards = [
    ["Available devices", availableDevices],
    ["Active rentals", activeRentals],
    ["Unpaid invoices", unpaidInvoices],
    ["Total revenue (IDR)", (revenue._sum.amount ?? 0).toLocaleString("id-ID")],
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border-l-4 border-blue-600 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
