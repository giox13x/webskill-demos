import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

// Middleware corre en Edge runtime. No lee AUTH_EMAIL/AUTH_PASSWORD de
// process.env aqui (el Edge Runtime de Vercel no lee de forma fiable
// variables desde un .env.production empaquetado). En su lugar compara
// contra el hash esperado, precalculado a partir de esas mismas
// credenciales (ver src/lib/auth.ts para el hash real usado al iniciar
// sesion en /api/auth/login, que si corre en Node.js y si lee el env).
const EXPECTED_AUTH_HASH = "cfaf8911c602ca540d8a94c122f7e9a73a6c7e9885e460da32f85d2f0701da48";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth/login).*)"],
};

function isPublicPath(pathname: string): boolean {
  if (pathname === "/probar" || pathname.startsWith("/probar/")) return true;
  if (/^\/api\/examples\/[^/]+\/(chat|corrections)(\/.*)?$/.test(pathname)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  if (isPublicPath(req.nextUrl.pathname)) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === EXPECTED_AUTH_HASH) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}
