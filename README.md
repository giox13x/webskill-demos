# Webskill Demos

Panel interno para crear demos de agentes de WhatsApp por cliente. Cada
"ejemplo" es una demo independiente: nombre, información del negocio,
instrucciones, reglas y restricciones — con un chat de prueba en vivo que
llama al proveedor de IA elegido (OpenAI, Anthropic/Claude o Google Gemini).

## Instalar

```bash
npm install
cp .env.local.example .env.local   # rellena Supabase (ver abajo)
npm run dev                        # http://localhost:3000
```

## Base de datos (Supabase)

1. Crea un proyecto en https://supabase.com (o usa uno existente).
2. Abre el SQL editor y ejecuta el contenido de `supabase/schema.sql`.
3. Copia `Project URL` y `service_role key` (Settings → API) a `.env.local`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Uso

1. Entra en **Ajustes** y pega las API keys de los proveedores que vayas a
   usar (OpenAI / Anthropic / Gemini) y elige el modelo por defecto.
2. En el dashboard principal, escribe el nombre de un cliente (ej. "Clínica
   Dental Sulí") y pulsa **Nuevo ejemplo**.
3. Dentro del ejemplo, rellena información del negocio, instrucciones,
   reglas y restricciones — y pruébalo en el chat de la derecha. Cada
   ejemplo puede además usar un proveedor/modelo distinto al de Ajustes.

## Proteger la URL pública

Al desplegar en Vercel, define `ACCESS_PASSWORD` en las variables de entorno
para pedir una contraseña compartida antes de dejar entrar — evita que
cualquiera con el link cree ejemplos o gaste tus créditos de API.

## Stack

Next.js (App Router) + TypeScript + Tailwind · Supabase (Postgres) ·
Vercel AI SDK (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`).
