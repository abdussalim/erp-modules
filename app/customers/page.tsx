"use client";
import { useEffect, useState } from "react";

type Customer = { id: number; name: string; phone: string; email: string };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  async function load() {
    setCustomers(await (await fetch("/api/customers")).json());
  }
  useEffect(() => {
    load();
  }, []);

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/customers", { method: "POST", body: JSON.stringify(form) });
    setForm({ name: "", phone: "", email: "" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Customers</h1>
      <p className="mb-6 text-slate-500">Customers who rent our devices.</p>

      <form onSubmit={addCustomer} className="card mb-6 flex flex-wrap gap-3">
        <input required placeholder="Name" className="rounded-lg border p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="Phone" className="rounded-lg border p-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required type="email" placeholder="Email" className="rounded-lg border p-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">Add customer</button>
      </form>

      <table className="w-full bg-white text-left shadow">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Phone</th>
            <th className="p-2">Email</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.phone}</td>
              <td className="p-2">{c.email}</td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr><td colSpan={3} className="text-center text-slate-500">No customers yet. Add one above.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
