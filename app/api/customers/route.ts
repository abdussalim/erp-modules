import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/customers -> all customers
export async function GET() {
  return NextResponse.json(await db.customer.findMany({ orderBy: { id: "asc" } }));
}

// POST /api/customers -> add a customer
export async function POST(req: NextRequest) {
  const { name, phone, email } = await req.json();
  const customer = await db.customer.create({ data: { name, phone, email } });
  return NextResponse.json(customer, { status: 201 });
}
