-- =====================================================================
-- OptimaBook — Tabela e bisedave (kujtesa e kanaleve: Telegram/WhatsApp/...)
-- Lejon AI-në të mbajë kontekstin mes mesazheve të një klienti.
-- Ekzekutohet i sigurt disa herë (idempotent).
-- =====================================================================

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  channel      text not null default 'telegram',
  chat_id      text not null,
  role         text not null check (role in ('user','bot')),
  content      text not null,
  created_at   timestamptz not null default now()
);
create index if not exists messages_lookup_idx
  on public.messages(business_id, channel, chat_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "own_messages" on public.messages;
create policy "own_messages" on public.messages for all
  using (public.is_my_business(business_id)) with check (public.is_my_business(business_id));
