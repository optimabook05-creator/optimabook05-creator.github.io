/* =====================================================================
   OptimaBook — Konfigurimi i Supabase
   Çelësi "publishable" është i SIGURT për frontend: të dhënat i mbron
   Row Level Security (RLS), jo fshehtësia e këtij çelësi.
   ===================================================================== */

export const SUPABASE_URL = "https://mhbrhrsjlxluxvwjhcne.supabase.co";
export const SUPABASE_KEY = "sb_publishable_pwtiVjYqEYLYPZXfgponIg_YC3xSIgs";

/* Bot-i MASTER i Telegram-it (lidhja 1-klik): të gjitha bizneset e ndajnë të
   njëjtin bot përmes deep-link-ut t.me/<BOT>?start=<business_id> — pronari
   s'ka nevojë për BotFather fare. Ndryshoje këtu nëse krijon bot me emër të ri. */
export const MASTER_BOT = "OptimaBookTestBot";
