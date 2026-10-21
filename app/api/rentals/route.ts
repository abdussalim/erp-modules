import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/rentals            -> all rentals
// GET /api/rentals?overdue=1  -> ACTIVE rentals past their end date (called by the n8n daily cron)
export async function GET(req: NextRequest) {
  const overdue = req.nextUrl.searchParams.get("overdue") === "1";
  const rentals = await db.rental.findMany({
    where: overdue ? { status: "ACTIVE", endDate: { lt: new Date() } } : {},
    orderBy: { id: "desc" },
    include: { customer: true, device: true, invoice: true },
  });
  return NextResponse.json(rentals);
}

// POST /api/rentals -> create rental + its invoice
export async function POST(req: NextRequest) {
  const { customerId, deviceId, destinationCountry, startDate, endDate } = await req.json();

  const device = await db.device.findUnique({ where: { id: Number(deviceId) } });
  if (!device || device.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Device is not available" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  if (!(days >= 1)) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  // Invoice is created together with the rental: amount = days x daily rate
  const rental = await db.rental.create({
    data: {
      customerId: Number(customerId),
      deviceId: device.id,
      destinationCountry,
      startDate: start,
      endDate: end,
      status: "PENDING_PAYMENT",
      invoice: { create: { amount: days * device.dailyRate, status: "UNPAID" } },
    },
    include: { invoice: true },
  });
  return NextResponse.json(rental, { status: 201 });
}

// PATCH /api/rentals { id } -> return the device: rental RETURNED, device AVAILABLE
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  const rental = await db.rental.update({ where: { id }, data: { status: "RETURNED" } });
  await db.device.update({ where: { id: rental.deviceId }, data: { status: "AVAILABLE" } });
  return NextResponse.json(rental);
}
