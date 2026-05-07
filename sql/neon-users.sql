create extension if not exists pgcrypto;

create schema if not exists neon_auth;

create table if not exists neon_auth."user" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  emailVerified boolean not null default false,
  image text,
  createdAt timestamptz not null default current_timestamp,
  updatedAt timestamptz not null default current_timestamp,
  role text,
  banned boolean,
  banReason text,
  banExpires timestamptz,
  password text
);

create index if not exists neon_auth_user_email_idx on neon_auth."user" (email);

create schema if not exists public;

create table if not exists public.user_predictions (
  user_id uuid primary key references neon_auth."user"(id) on delete cascade,
  games jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists user_predictions_updated_at_idx on public.user_predictions (updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists neon_auth_user_set_updated_at on neon_auth."user";

create trigger neon_auth_user_set_updated_at
before update on neon_auth."user"
for each row
execute function public.set_updated_at();
