import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "pe_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type AdminUser = {
  displayName: string;
};

function getSecrets() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  return { password, secret };
}

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(signature);
}

async function verify(value: string, signature: string, secret: string) {
  const expected = await sign(value, secret);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createAdminSession() {
  const { secret } = getSecrets();
  if (!secret) throw new Error("ADMIN_SECRET or ADMIN_PASSWORD must be set");

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `admin:${expiresAt}`;
  const signature = await sign(payload, secret);
  const jar = await cookies();
  jar.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const { secret } = getSecrets();
  if (!secret) return null;

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const splitAt = token.lastIndexOf(".");
  if (splitAt < 0) return null;
  const payload = token.slice(0, splitAt);
  const signature = token.slice(splitAt + 1);
  if (!(await verify(payload, signature, secret))) return null;

  const [, expiresRaw] = payload.split(":");
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return { displayName: process.env.ADMIN_NAME?.trim() || "Owner" };
}

export async function requireAdminUser(returnTo = "/admin"): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user) return user;
  redirect(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function validateAdminPassword(password: string) {
  const { password: expected } = getSecrets();
  if (!expected) return false;
  if (password.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < password.length; i += 1) {
    mismatch |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
