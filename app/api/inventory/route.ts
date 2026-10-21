import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/inventory -> all devices
export async function GET() {
  return NextResponse.json(await db.device.findMany({ orderBy: { id: "asc" } }));
}

// POST /api/inventory -> add a device
export async function POST(req: NextRequest) {
  const { serialNumber, model, dailyRate } = await req.json();
  const device = await db.device.create({
    data: { serialNumber, model, dailyRate: Number(dailyRate) },
  });
  return NextResponse.json(device, { status: 201 });
}

// PATCH /api/inventory -> change device status { id, status }
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  return NextResponse.json(await db.device.update({ where: { id }, data: { status } }));
}
