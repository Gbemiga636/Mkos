import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

/** Status check for CMS tables + optional seed trigger docs */
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error, count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({
        ok: false,
        tablesReady: false,
        message: error.message,
        nextStep: "Run supabase/migrations/001_cms_schema.sql in the Supabase SQL Editor, then npm run cms:seed",
      });
    }

    return NextResponse.json({
      ok: true,
      tablesReady: true,
      productCount: count ?? data?.length ?? 0,
      nextStep: (count ?? 0) === 0 ? "Run npm run cms:seed" : "CMS is live",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function POST() {
  // Return schema SQL so it can be copied from the API if needed
  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "001_cms_schema.sql");
  const sql = await readFile(sqlPath, "utf8");
  return NextResponse.json({
    message: "Paste this SQL into Supabase SQL Editor, then run npm run cms:seed",
    sql,
  });
}
