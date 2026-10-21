import crypto from "crypto";
import { db } from "@/lib/db";
import { notifyN8n } from "@/lib/n8n";

const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";

// No server key in .env = MOCK mode (no real Midtrans calls).
export const isMock = serverKey === "";

const authHeader = "Basic " + Buffer.from(serverKey + ":").toString("base64");

// Ask Midtrans Snap (sandbox) for a payment token the browser can open.
export async function createSnapToken(orderId: string, amount: number) {
  const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: amount },
    }),
  });
  const json = await res.json();
  if (!json.token) throw new Error("Midtrans error: " + JSON.stringify(json));
  return json.token as string;
}

// Ask Midtrans for the current status of an order (used by "Check status").
export async function getTransactionStatus(orderId: string) {
  const res = await fetch(`https://api.sandbox.midtrans.com/v2/${orderId}/status`, {
    headers: { Authorization: authHeader },
  });
  return res.json();
}

// Midtrans signs its notifications: sha512(order_id + status_code + gross_amount + serverKey).
export function isValidSignature(n: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  const expected = crypto
    .createHash("sha512")
    .update(n.order_id + n.status_code + n.gross_amount + serverKey)
    .digest("hex");
  return expected === n.signature_key;
}

// The ONE place that marks an invoice as paid. Used by callback, "Check status" and mock pay.
export async function markInvoicePaid(invoiceId: number) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { rental: { include: { customer: true, device: true } } },
  });
  if (!invoice || invoice.status === "PAID") return invoice; // already done, do nothing

  await db.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });
  await db.rental.update({ where: { id: invoice.rentalId }, data: { status: "ACTIVE" } });
  await db.device.update({ where: { id: invoice.rental.deviceId }, data: { status: "RENTED" } });

  // Tell n8n so it can send a notification
  await notifyN8n("payment.paid", {
    invoiceId: invoice.id,
    amount: invoice.amount,
    customer: invoice.rental.customer.name,
    device: invoice.rental.device.serialNumber,
    country: invoice.rental.destinationCountry,
  });
  return invoice;
}

export const isPaidStatus = (s: string) => s === "settlement" || s === "capture";
