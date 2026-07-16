-- Webskill Demos — esquema de base de datos (Supabase / Postgres)
-- Ejecutar una sola vez en el SQL editor del proyecto Supabase.

create extension if not exists pgcrypto;

-- Ajustes globales (una sola fila): API keys por proveedor + proveedor/modelo
-- por defecto para los ejemplos que no lo sobrescriban.
create table if not exists app_settings (
  id integer primary key default 1,
  openai_api_key text,
  anthropic_api_key text,
  gemini_api_key text,
  default_provider text not null default 'openai'
    check (default_provider in ('openai', 'anthropic', 'gemini')),
  default_model text not null default 'gpt-4o-mini',
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into app_settings (id) values (1)
on conflict (id) do nothing;

-- Cada "ejemplo" es una demo de agente para un cliente/prospecto concreto.
create table if not exists examples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  client_info text not null default '',
  instructions text not null default '',
  rules text not null default '',
  restrictions text not null default '',
  provider text check (provider in ('openai', 'anthropic', 'gemini')),
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists examples_created_at_idx on examples (created_at desc);

-- Historial del chat de prueba de cada ejemplo.
create table if not exists example_messages (
  id uuid primary key default gen_random_uuid(),
  example_id uuid not null references examples (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists example_messages_example_id_idx
  on example_messages (example_id, created_at);

-- ── Migración 2: archivos/datos, correcciones, sesiones por visitante ──────

-- Archivos y datos de conocimiento por ejemplo. La IA los procesa (resume)
-- para usarlos como base de conocimiento del agente.
create table if not exists example_files (
  id uuid primary key default gen_random_uuid(),
  example_id uuid not null references examples (id) on delete cascade,
  filename text not null,
  content_type text,
  raw_text text not null default '',
  summary text,
  status text not null default 'pending' check (status in ('pending', 'processed', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists example_files_example_id_idx
  on example_files (example_id, created_at);

-- Correcciones enseñadas desde el enlace de corrección: qué preguntó el
-- visitante, qué respondió mal el agente, y qué debería haber respondido.
create table if not exists example_corrections (
  id uuid primary key default gen_random_uuid(),
  example_id uuid not null references examples (id) on delete cascade,
  original_message text not null,
  wrong_response text not null,
  corrected_response text not null,
  created_at timestamptz not null default now()
);

create index if not exists example_corrections_example_id_idx
  on example_corrections (example_id, created_at);

-- Sesión de chat separada por visitante — así el enlace público de un cliente
-- no se mezcla con tus propias pruebas ni con las de otro visitante.
alter table example_messages add column if not exists session_id text not null default 'admin';

create index if not exists example_messages_session_idx
  on example_messages (example_id, session_id, created_at);

-- ── Migración 3: identidad del agente (nombre + avatar) ────────────────────

-- Nombre y avatar con los que el bot se presenta (como "Carlos" en el SaaS
-- principal). Se pueden usar como {{agent_name}} / {{business_name}} dentro
-- de las instrucciones, reglas o restricciones.
alter table examples add column if not exists agent_name text not null default 'Carlos';
alter table examples add column if not exists agent_avatar_key text not null default 'blue';

-- ── Migración 4: nombre de la empresa ───────────────────────────────────────

-- Nombre de la empresa/cliente con el que se sustituye {{business_name}}.
-- Si se deja vacío, se usa el nombre del ejemplo (example.name) como antes.
alter table examples add column if not exists business_name text not null default '';
