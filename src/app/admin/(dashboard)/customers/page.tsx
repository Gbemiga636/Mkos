import { createServiceClient } from "@/lib/supabase/client";

export default async function CustomersPage() {
  const sb = createServiceClient();
  const { data: profiles } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          People
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          Customers
        </h1>
      </div>
      <div className="overflow-hidden border border-mkos-border bg-white">
        {(profiles ?? []).map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-mkos-border px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-mkos-warm text-sm text-mkos-accent">
                {(p.full_name || p.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-mkos-ink">{p.full_name || "Customer"}</p>
                <p className="text-xs text-mkos-muted">{p.email}</p>
              </div>
            </div>
            <div className="text-right text-xs text-mkos-muted">
              <p>{p.phone || "No phone"}</p>
              <p>{p.reward_points ?? 0} points</p>
            </div>
          </div>
        ))}
        {!profiles?.length && (
          <p className="p-6 text-sm text-mkos-muted">No customer accounts yet.</p>
        )}
      </div>
    </div>
  );
}
