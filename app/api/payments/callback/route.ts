import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMock, isPaidStatus, isValidSignature, markInvoicePaid } from "@/lib/midtrans";

// POST /api/payments/callback
// 1) Midtrans notification (needs a public URL, e.g. ngrok) - signature is verified.
// 2) Mock mode only: { mock: true, invoiceId } simulates a successful payment.
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.mock) {
    if (!isMock) return NextResponse.json({ error: "Mock not allowed" }, { status: 403 });
    await markInvoicePaid(Number(body.invoiceId));
    return NextResponse.json({ ok: true });
  }

  if (!isValidSignature(body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }
  if (isPaidStatus(body.transaction_status)) {
    const invoice = await db.invoice.findFirst({ where: { midtransOrderId: body.order_id } });
    if (invoice) await markInvoicePaid(invoice.id);
  }
  return NextResponse.json({ ok: true });
}
