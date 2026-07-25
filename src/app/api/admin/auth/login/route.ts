import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  createSession,
  ensureAdminSeed,
  getAdminByEmail,
  hashPassword,
  setSessionCookie,
  validatePassword,
  verifyPassword,
  writeAudit,
} from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    await ensureAdminSeed();
    const body = await req.json();
    const email = String(body.email ?? "")
      .toLowerCase()
      .trim();
    const password = String(body.password ?? "");
    const remember = Boolean(body.remember);

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }

    const admin = await getAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ error: "Administrator not found." }, { status: 401 });
    }

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return NextResponse.json(
        { error: "Account temporarily locked. Try again later." },
        { status: 423 }
      );
    }

    const passwordIsSet = Boolean(admin.password_hash && !admin.must_set_password);

    // First-time / password-not-set: allow email-only access, then nag to set password
    if (!passwordIsSet) {
      if (password) {
        return NextResponse.json(
          {
            error:
              "No password has been set yet. Sign in with email only, then create your password.",
          },
          { status: 400 }
        );
      }
      const { token, expires } = await createSession(admin.id, {
        userAgent: req.headers.get("user-agent") ?? undefined,
      });
      await setSessionCookie(token, remember ? expires : new Date(Date.now() + 1000 * 60 * 60 * 12));
      const sb = createServiceClient();
      await sb
        .from("admin_accounts")
        .update({ last_login_at: new Date().toISOString(), failed_logins: 0 })
        .eq("id", admin.id);
      await writeAudit(admin.id, "login_email_only");
      return NextResponse.json({
        ok: true,
        mustSetPassword: true,
        admin: { id: admin.id, email: admin.email, full_name: admin.full_name },
      });
    }

    // Password required thereafter
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const valid = await verifyPassword(password, admin.password_hash!);
    if (!valid) {
      const sb = createServiceClient();
      const fails = (admin.failed_logins ?? 0) + 1;
      const patch: Record<string, unknown> = { failed_logins: fails };
      if (fails >= 6) {
        patch.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      await sb.from("admin_accounts").update(patch).eq("id", admin.id);
      await writeAudit(admin.id, "login_failed");
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }

    const { token, expires } = await createSession(admin.id, {
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    await setSessionCookie(token, remember ? expires : new Date(Date.now() + 1000 * 60 * 60 * 12));
    const sb = createServiceClient();
    await sb
      .from("admin_accounts")
      .update({
        last_login_at: new Date().toISOString(),
        failed_logins: 0,
        locked_until: null,
      })
      .eq("id", admin.id);
    await writeAudit(admin.id, "login_success");

    return NextResponse.json({
      ok: true,
      mustSetPassword: false,
      admin: { id: admin.id, email: admin.email, full_name: admin.full_name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  // Set / update password
  try {
    const body = await req.json();
    const password = String(body.password ?? "");
    const confirm = String(body.confirm ?? "");
    const strength = validatePassword(password);
    if (!strength.ok) {
      return NextResponse.json(
        { error: "Password does not meet security requirements.", strength },
        { status: 400 }
      );
    }
    if (password !== confirm) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const { getSessionAdmin } = await import("@/lib/admin/auth");
    const session = await getSessionAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hash = await hashPassword(password);
    const sb = createServiceClient();
    await sb
      .from("admin_accounts")
      .update({
        password_hash: hash,
        password_set_at: new Date().toISOString(),
        must_set_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.admin.id);

    await writeAudit(session.admin.id, "password_set");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not set password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
