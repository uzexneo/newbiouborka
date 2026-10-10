import crypto from "crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

function getSessionSecret(): string | undefined {
  return (
    process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || undefined
  );
}

function safeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

function signPayload(payload: string): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Пароль администратора не настроен");
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = String(expires);
  return `${payload}.${signPayload(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !process.env.ADMIN_PASSWORD || !getSessionSecret())
    return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature || !/^\d+$/.test(payload)) return false;
  if (!safeEqual(signature, signPayload(payload))) return false;
  const expires = Number(payload);
  if (!Number.isFinite(expires)) return false;
  return Date.now() < expires && expires <= Date.now() + SESSION_MAX_AGE * 1000;
}

export function isAdminRequest(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}
