import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedAuthCookieValue } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth/login).*)"],
};

export async function middleware(req: NextRequest) {
  const expected = await expectedAuthCookieValue();
  // Sin ACCESS_PASSWORD configurada, la app queda abierta (útil en local/dev).
  if (!expected) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === expected) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}
