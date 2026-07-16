// Login del panel interno (usuario + contraseña). Se definen con las
// variables de entorno AUTH_EMAIL y AUTH_PASSWORD; si no están configuradas,
// la app queda abierta sin login (útil en local/dev).
// Los enlaces públicos /probar/* nunca pasan por este gate (ver middleware.ts).

export const AUTH_COOKIE = "wsk_auth";

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getAuthCredentials(): { email: string; password: string } | null {
  const email = process.env.AUTH_EMAIL;
  const password = process.env.AUTH_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export async function expectedAuthCookieValue(): Promise<string | null> {
  const creds = getAuthCredentials();
  if (!creds) return null;
  return sha256Hex(`${creds.email.toLowerCase()}:${creds.password}`);
}
