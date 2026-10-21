"use client";
import { useEffect, useState } from "react";

type Device = { id: number; serialNumber: string; model: string; status: string; dailyRate: number };

export default function InventoryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState({ serialNumber: "", model: "", dailyRate: "" });

  async function load() {
    setDevices(await (await fetch("/api/inventory")).json());
  }
  useEffect(() => {
    load();
  }, []);

  async function addDevice(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/inventory", { method: "POST", body: JSON.stringify(form) });
    setForm({ serialNumber: "", model: "", dailyRate: "" });
    load();
  }

  async function changeStatus(id: number, status: string) {
    await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id, status }) });
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Inventory</h1>

      <form onSubmit={addDevice} className="mb-6 flex flex-wrap gap-2">
        <input required placeholder="Serial number" className="rounded-lg border p-2" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
        <input required placeholder="Model" className="rounded-lg border p-2" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <input required type="number" placeholder="Daily rate (IDR)" className="rounded-lg border p-2" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} />
        <button className="rounded-lg bg-blue-700 px-4 text-white">Add device</button>
      </form>

      <table className="w-full bg-white text-left shadow">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2">Serial</th>
            <th className="p-2">Model</th>
            <th className="p-2">Daily rate</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="p-2">{d.serialNumber}</td>
              <td className="p-2">{d.model}</td>
              <td className="p-2">{d.dailyRate.toLocaleString("id-ID")}</td>
              <td className="p-2">
                <select value={d.status} onChange={(e) => changeStatus(d.id, e.target.value)} className="rounded-lg border p-1">
                  <option>AVAILABLE</option>
                  <option>RENTED</option>
                  <option>SERVICE</option>
                </select>
              </td>
            </tr>
          ))}
          {devices.length === 0 && (
            <tr><td colSpan={4} className="text-center text-slate-500">No devices yet. Add one above.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
