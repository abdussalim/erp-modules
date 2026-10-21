"use client";
import { useEffect, useState } from "react";

type Invoice = {
  id: number;
  amount: number;
  status: string;
  paidAt: string | null;
  rental: { customer: { name: string }; device: { serialNumber: string } };
};

// Minimal typing for the Midtrans Snap popup script
declare global {
  interface Window {
    snap?: { pay: (token: string, options?: object) => void };
  }
}

// Load Midtrans snap.js once (sandbox)
function loadSnap() {
  return new Promise<void>((resolve) => {
    if (window.snap) return resolve();
    const s = document.createElement("script");
    s.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    s.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "");
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    setInvoices(await (await fetch("/api/invoices")).json());
  }
  useEffect(() => {
    load();
  }, []);

  // PAY flow: ask our API for a payment -> open Snap popup (or simulate in mock mode)
  async function pay(invoiceId: number) {
    const res = await fetch("/api/payments", { method: "POST", body: JSON.stringify({ invoiceId }) });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error);

    if (data.mock) {
      // MOCK mode (no Midtrans keys): confirm, then call the callback route with a mock flag
      if (confirm("Simulate payment?")) {
        await fetch("/api/payments/callback", { method: "POST", body: JSON.stringify({ mock: true, invoiceId }) });
        load();
      }
      return;
    }

    await loadSnap();
    window.snap!.pay(data.token, {
      onSuccess: () => checkStatus(invoiceId),
      onPending: () => setMessage("Payment pending. Click Check status later."),
    });
  }

  // Ask Midtrans (via our API) whether the invoice was paid. Works without a public callback URL.
  async function checkStatus(invoiceId: number) {
    const res = await fetch(`/api/payments?invoiceId=${invoiceId}`);
    const data = await res.json();
    setMessage(`Invoice ${invoiceId}: ${data.status}`);
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Billing</h1>
      {message && <p className="mb-2 text-blue-700">{message}</p>}

      <table className="w-full bg-white text-left shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Invoice</th>
            <th className="p-2">Customer</th>
            <th className="p-2">Device</th>
            <th className="p-2">Amount (IDR)</th>
            <th className="p-2">Status</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id} className="border-t">
              <td className="p-2">#{i.id}</td>
              <td className="p-2">{i.rental.customer.name}</td>
              <td className="p-2">{i.rental.device.serialNumber}</td>
              <td className="p-2">{i.amount.toLocaleString("id-ID")}</td>
              <td className="p-2">{i.status}</td>
              <td className="flex gap-2 p-2">
                {i.status === "UNPAID" && (
                  <>
                    <button onClick={() => pay(i.id)} className="rounded bg-blue-700 px-3 py-1 text-white">Pay</button>
                    <button onClick={() => checkStatus(i.id)} className="rounded border px-3 py-1">Check status</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
