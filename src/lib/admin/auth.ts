import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/client";
import { ADMIN_EMAIL } from "@/lib/admin/constants";

export { ADMIN_EMAIL } from "@/lib/admin/constants";
export const SESSION_COOKIE = "mkos_admin_session";
/** Readable by the storefront so analytics can skip admin browsing. */
export const ANALYTICS_OPTOUT_COOKIE = "mkos_skip_analytics";
const SESSION_DAYS = 14;

export type AdminAccount = {
  id: string;
  email: string;
  password_hash: string | null;
  password_set_at: string | null;
  full_name: string | null;
  role: string;
  must_set_password: boolean;
  failed_logins: number;
  locked_until: string | null;
  last_login_at: string | null;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function validatePassword(password: string) {
  const checks = {
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    score,
    ok: Object.values(checks).every(Boolean),
    label: score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Strong" : "Excellent",
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function ensureAdminSeed() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("admin_accounts")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();
  if (!data) {
    await sb.from("admin_accounts").insert({
      email: ADMIN_EMAIL,
      must_set_password: true,
      full_name: "MKoS House",
      role: "owner",
    });
  }
}

export async function getAdminByEmail(email: string) {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("admin_accounts")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error) throw error;
  return data as AdminAccount | null;
}

export async function createSession(
  adminId: string,
  meta?: { userAgent?: string; ip?: string }
) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  const sb = createServiceClient();
  await sb.from("admin_sessions").insert({
    admin_id: adminId,
    token_hash: tokenHash,
    user_agent: meta?.userAgent ?? null,
    ip_address: meta?.ip ?? null,
    expires_at: expires.toISOString(),
  });
  return { token, expires };
}

export async function revokeSession(token: string) {
  const sb = createServiceClient();
  await sb
    .from("admin_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", hashToken(token));
}

export async function getSessionAdmin() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sb = createServiceClient();
  const { data: session } = await sb
    .from("admin_sessions")
    .select("id, admin_id, expires_at, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!session || session.revoked_at) return null;
  if (new Date(session.expires_at) < new Date()) return null;
  const { data: admin } = await sb
    .from("admin_accounts")
    .select("*")
    .eq("id", session.admin_id)
    .maybeSingle();
  if (!admin) return null;
  return { admin: admin as AdminAccount, token };
}

export async function setSessionCookie(token: string, expires: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  jar.set(ANALYTICS_OPTOUT_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  jar.set(ANALYTICS_OPTOUT_COOKIE, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function writeAudit(
  adminId: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  meta?: Record<string, unknown>
) {
  try {
    const sb = createServiceClient();
    await sb.from("admin_audit_logs").insert({
      admin_id: adminId,
      action,
      entity: entity ?? null,
      entity_id: entityId ?? null,
      meta: meta ?? {},
    });
  } catch {
    // non-blocking
  }
}
