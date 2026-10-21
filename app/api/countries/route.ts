import { NextResponse } from "next/server";

// GET /api/countries -> country names from an external API (countriesnow.space, no key needed).
// Called server-side so the browser only talks to our own API.
export async function GET() {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/iso", {
      next: { revalidate: 86400 }, // cache for one day
    });
    const json: { data: { name: string }[] } = await res.json();
    return NextResponse.json(json.data.map((c) => c.name).sort());
  } catch {
    // External API down: fall back to a few common destinations so the form still works
    return NextResponse.json(["Japan", "Malaysia", "Saudi Arabia", "Singapore", "South Korea", "Thailand"]);
  }
}
