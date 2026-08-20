import { NextResponse } from "next/server";

// Login desactivado a pedido del usuario — el panel queda abierto sin
// usuario/contraseña. La ruta /login y /api/auth/login se dejan intactas
// (sin uso) por si se quiere reactivar el auth más adelante.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware() {
  return NextResponse.next();
}
