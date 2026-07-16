import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, getAuthCredentials, sha256Hex } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const creds = getAuthCredentials();

  if (!creds) return NextResponse.json({ ok: true });

  const emailOk = email?.trim().toLowerCase() === creds.email.toLowerCase();
  const passwordOk = password === creds.password;

  if (!emailOk || !passwordOk) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await sha256Hex(`${creds.email.toLowerCase()}:${creds.password}`), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
