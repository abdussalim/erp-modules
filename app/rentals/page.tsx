"use client";
import { useEffect, useState } from "react";

type Rental = {
  id: number;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  status: string;
  customer: { name: string };
  device: { serialNumber: string };
  invoice: { amount: number } | null;
};

const empty = { customerId: "", deviceId: "", destinationCountry: "", startDate: "", endDate: "" };

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [devices, setDevices] = useState<{ id: number; serialNumber: string; model: string; status: string }[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  async function load() {
    setRentals(await (await fetch("/api/rentals")).json());
    setDevices(await (await fetch("/api/inventory")).json());
  }

  useEffect(() => {
    load();
    (async () => setCustomers(await (await fetch("/api/customers")).json()))();
    // Country list comes from an external API, proxied by our /api/countries route
    (async () => setCountries(await (await fetch("/api/countries")).json()))();
  }, []);

  async function createRental(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/rentals", { method: "POST", body: JSON.stringify(form) });
    if (!res.ok) return setError((await res.json()).error);
    setError("");
    setForm(empty);
    load();
  }

  async function returnRental(id: number) {
    await fetch("/api/rentals", { method: "PATCH", body: JSON.stringify({ id }) });
    load();
  }

  const field = "rounded border p-2";
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Rentals</h1>

      <form onSubmit={createRental} className="mb-2 flex flex-wrap gap-2">
        <select required className={field} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          <option value="">Customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select required className={field} value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}>
          <option value="">Available device...</option>
          {devices.filter((d) => d.status === "AVAILABLE").map((d) => (
            <option key={d.id} value={d.id}>{d.serialNumber} ({d.model})</option>
          ))}
        </select>
        <select required className={field} value={form.destinationCountry} onChange={(e) => setForm({ ...form, destinationCountry: e.target.value })}>
          <option value="">Destination country...</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input required type="date" className={field} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <input required type="date" className={field} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        <button className="rounded bg-blue-700 px-4 text-white">Create rental</button>
      </form>
      {error && <p className="mb-2 text-red-600">{error}</p>}

      <table className="mt-4 w-full bg-white text-left shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Customer</th>
            <th className="p-2">Device</th>
            <th className="p-2">Country</th>
            <th className="p-2">Period</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Status</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rentals.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.customer.name}</td>
              <td className="p-2">{r.device.serialNumber}</td>
              <td className="p-2">{r.destinationCountry}</td>
              <td className="p-2">{r.startDate.slice(0, 10)} to {r.endDate.slice(0, 10)}</td>
              <td className="p-2">{r.invoice?.amount.toLocaleString("id-ID")}</td>
              <td className="p-2"><span className="badge" data-status={r.status}>{r.status}</span></td>
              <td className="p-2">
                {r.status === "ACTIVE" && (
                  <button onClick={() => returnRental(r.id)} className="rounded bg-green-600 px-3 py-1 text-white">Return</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
