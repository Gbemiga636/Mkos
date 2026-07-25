import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionAdmin,
  revokeSession,
  writeAudit,
} from "@/lib/admin/auth";

export async function POST() {
  const session = await getSessionAdmin();
  if (session) {
    await revokeSession(session.token);
    await writeAudit(session.admin.id, "logout");
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSessionAdmin();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    mustSetPassword: session.admin.must_set_password || !session.admin.password_hash,
    admin: {
      id: session.admin.id,
      email: session.admin.email,
      full_name: session.admin.full_name,
      role: session.admin.role,
    },
  });
}
