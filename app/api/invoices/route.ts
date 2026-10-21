import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/invoices -> all invoices with rental info (for the Billing page)
export async function GET() {
  const invoices = await db.invoice.findMany({
    orderBy: { id: "desc" },
    include: { rental: { include: { customer: true, device: true } } },
  });
  return NextResponse.json(invoices);
}
