import { NextResponse } from "next/server";
import { getSessionAdmin, writeAudit } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";
import { revalidateStorefront } from "@/lib/cms/revalidate";
import { BRAND_NAME, normalizeBrandText } from "@/lib/brand";

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = createServiceClient();
  const { data } = await sb.from("site_settings").select("*").eq("id", "main").maybeSingle();
  if (data?.brand_name) {
    data.brand_name = normalizeBrandText(data.brand_name);
  }
  return NextResponse.json({ settings: data });
}

export async function PUT(req: Request) {
  const session = await getSessionAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const sb = createServiceClient();
  const { data: current } = await sb
    .from("site_settings")
    .select("social")
    .eq("id", "main")
    .maybeSingle();
  const social = {
    ...((current?.social as Record<string, string>) || {}),
    instagram: body.instagram || "",
    whatsapp: body.whatsapp || "",
  };
  const { data, error } = await sb
    .from("site_settings")
    .upsert({
      id: "main",
      brand_name: normalizeBrandText(body.brand_name || BRAND_NAME),
      tagline: body.tagline,
      logo_url: body.logo_url,
      currency: body.currency,
      free_shipping_threshold: Number(body.free_shipping_threshold),
      shipping_fee: Number(body.shipping_fee),
      social,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(session.admin.id, "settings_update", "site_settings", "main");
  revalidateStorefront();
  return NextResponse.json({ settings: data });
}
