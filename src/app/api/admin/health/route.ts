import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";

/**
 * Attempts to apply critical admin tables if missing.
 * Prefer running supabase/migrations/004_admin_platform.sql in SQL Editor.
 */
export async function POST() {
  return NextResponse.json({
    ok: false,
    message:
      "Open Supabase → SQL Editor and run supabase/migrations/004_admin_platform.sql",
  });
}

export async function GET() {
  const sb = createServiceClient();
  const checks: Record<string, boolean> = {};
  for (const table of [
    "admin_accounts",
    "admin_sessions",
    "analytics_events",
    "analytics_live",
    "blog_posts",
    "site_pages",
  ]) {
    const { error } = await sb.from(table).select("*", { count: "exact", head: true });
    checks[table] = !error;
  }
  return NextResponse.json({
    ready: Object.values(checks).every(Boolean),
    checks,
    migration: "supabase/migrations/004_admin_platform.sql",
  });
}
