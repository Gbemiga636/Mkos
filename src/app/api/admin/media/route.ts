import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ assets: [] });
  return NextResponse.json({ assets: data ?? [] });
}
