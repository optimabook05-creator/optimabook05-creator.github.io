-- ============================================================
-- OptimaBook — ÇMIMET E GJALLA (për tregtarët: telefona, parfume…)
-- Çdo produkt mban datën e fundit kur iu ndryshua çmimi.
-- Kur biznesi ka "çmime që ndryshojnë shpesh" (config.volatilePrices),
-- AI-ja jep çmim VETËM nëse është i freskët — përndryshe konfirmon
-- disponibilitetin, kap klientin dhe njofton pronarin. Zero çmime të gabuara.
-- I sigurt të ekzekutohet sa herë të duash (idempotent).
-- ============================================================

alter table public.services add column if not exists price_updated_at timestamptz not null default now();

-- Trigger: sa herë ndryshon çmimi (nga paneli, importi apo Telegram-i),
-- data e freskisë përditësohet VETË — asnjë kod klienti s'duhet ta mbajë mend.
create or replace function public.touch_price_updated_at()
returns trigger language plpgsql as $$
begin
  if new.price is distinct from old.price then
    new.price_updated_at := now();
  end if;
  return new;
end $$;

drop trigger if exists services_price_touch on public.services;
create trigger services_price_touch before update on public.services
for each row execute function public.touch_price_updated_at();
