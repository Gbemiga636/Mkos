import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionAdmin } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionAdmin();
  if (!session) redirect("/admin/login");

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <AdminShell
        admin={{
          email: session.admin.email,
          full_name: session.admin.full_name,
          mustSetPassword: session.admin.must_set_password || !session.admin.password_hash,
        }}
      >
        {children}
      </AdminShell>
    </Suspense>
  );
}
