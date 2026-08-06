import { NextResponse } from "next/server";
import { getNgnRates } from "@/lib/currency/rates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getNgnRates();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
