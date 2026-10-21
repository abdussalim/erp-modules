import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createSnapToken,
  getTransactionStatus,
  isMock,
  isPaidStatus,
  markInvoicePaid,
} from "@/lib/midtrans";

// POST /api/payments { invoiceId } -> start a payment (Snap token, or {mock:true})
export async function POST(req: NextRequest) {
  const { invoiceId } = await req.json();
  const invoice = await db.invoice.findUnique({ where: { id: Number(invoiceId) } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  if (isMock) return NextResponse.json({ mock: true });

  // A new order id each time, so a failed attempt can be retried
  const orderId = `INV-${invoice.id}-${Date.now()}`;
  const token = await createSnapToken(orderId, invoice.amount);
  await db.invoice.update({ where: { id: invoice.id }, data: { midtransOrderId: orderId } });
  return NextResponse.json({ token });
}

// GET /api/payments?invoiceId=1 -> ask Midtrans for the status ("Check status" button).
// Works on localhost where Midtrans cannot reach our callback.
export async function GET(req: NextRequest) {
  const invoiceId = Number(req.nextUrl.searchParams.get("invoiceId"));
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "PAID" || !invoice.midtransOrderId) {
    return NextResponse.json({ status: invoice.status });
  }

  const result = await getTransactionStatus(invoice.midtransOrderId);
  if (isPaidStatus(result.transaction_status)) await markInvoicePaid(invoice.id);
  return NextResponse.json({ status: result.transaction_status ?? "unknown" });
}
