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
