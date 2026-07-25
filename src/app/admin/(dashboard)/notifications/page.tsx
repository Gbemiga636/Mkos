import { createServiceClient } from "@/lib/supabase/client";

export default async function NotificationsPage() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
          Inbox
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-mkos-ink">
          Notifications
        </h1>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((n) => (
          <div key={n.id} className="border border-mkos-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-mkos-ink">{n.title}</p>
              <span className="font-display text-[10px] tracking-[0.16em] text-mkos-muted uppercase">
                {n.kind}
              </span>
            </div>
            <p className="mt-2 text-sm text-mkos-muted">{n.body}</p>
            <p className="mt-2 text-xs text-mkos-muted">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))}
        {!data?.length && (
          <p className="text-sm text-mkos-muted">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
