create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id text primary key,
  status text not null,
  order_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create or replace function public.set_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_orders_updated_at();

-- Create a private Storage bucket named ai-wedding-assets in the Supabase dashboard.
-- Server-side code accesses it with SUPABASE_SERVICE_ROLE_KEY.
insert into storage.buckets (id, name, public)
values ('ai-wedding-assets', 'ai-wedding-assets', false)
on conflict (id) do nothing;
