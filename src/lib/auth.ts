// Gate de acceso simple por contraseña compartida (opcional). Si no defines
// ACCESS_PASSWORD como variable de entorno, la app queda abierta sin login.

export const AUTH_COOKIE = "wsk_auth";

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedAuthCookieValue(): Promise<string | null> {
  const pw = process.env.ACCESS_PASSWORD;
  if (!pw) return null;
  return sha256Hex(pw);
}
