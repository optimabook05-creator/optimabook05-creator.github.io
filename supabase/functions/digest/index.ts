// @ts-nocheck  — Ekzekutohet në DENO (Supabase Edge Functions), jo në Node.
// =====================================================================
// OptimaBook — "DITA IME" (përmbledhja e mëngjesit, ora ~08:00)
// Për çdo pronar që ka aktivizuar njoftimet push: një njoftim i vetëm
// me ditën e sotme (sa takime, i pari në orën X) + të djeshmen (blerës
// të kapur nga AI). Rituali i përditshëm që e bën panelin zakon.
//
// Thirret nga pg_cron (digest.sql) çdo mëngjes. Verify JWT: OFF.
// Dërgon VETËM kur ka diçka për të thënë (zero spam ditëve bosh).
// Ripërdor funksionin 'push' për dërgimin (VAPID etj. janë atje).
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const pad = (n: number) => String(n).padStart(2, "0");
const hm = (t: string) => (t ? String(t).slice(0, 5) : "");

// Data e sotme/djeshme në timezone-in e biznesit (si nowInTz te chat)
function dateInTz(tz: string, offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 864e5);
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz || "Europe/Tirane", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

Deno.serve(async () => {
  try {
    // Vetëm bizneset që kanë të paktën një pajisje me push të aktivizuar
    const { data: subs } = await supabase.from("push_subs").select("business_id");
    const bizIds = [...new Set((subs || []).map((s: any) => s.business_id))];
    let sent = 0;

    for (const bid of bizIds) {
      try {
        const { data: biz } = await supabase.from("businesses").select("name, lang, timezone").eq("id", bid).maybeSingle();
        if (!biz) continue;
        const sq = (biz.lang || "sq").toLowerCase().startsWith("sq");
        const today = dateInTz(biz.timezone), yesterday = dateInTz(biz.timezone, -1);

        // Sot: takimet aktive + i pari
        const { data: appts } = await supabase.from("appointments")
          .select("appt_time, status").eq("business_id", bid).eq("appt_date", today).neq("status", "cancelled")
          .order("appt_time").limit(50);
        const todayN = (appts || []).length;
        const firstAt = todayN ? hm(appts[0].appt_time) : "";

        // Dje: blerës të kapur nga AI/faqja (takime AI + porosi jo-manuale + kërkesa)
        let buyers = 0;
        try {
          const { count } = await supabase.from("appointments").select("id", { count: "exact", head: true })
            .eq("business_id", bid).eq("source", "ai").gte("created_at", yesterday).lt("created_at", today);
          buyers += count || 0;
        } catch (_e) {}
        try {
          const { count } = await supabase.from("orders").select("id", { count: "exact", head: true })
            .eq("business_id", bid).neq("created_by", "manual").gte("placed_at", yesterday).lt("placed_at", today);
          buyers += count || 0;
        } catch (_e) {}
        try {
          const { count } = await supabase.from("leads").select("id", { count: "exact", head: true })
            .eq("business_id", bid).gte("created_at", yesterday).lt("created_at", today);
          buyers += count || 0;
        } catch (_e) {}

        /* ---- KËRKESAT E FTOHTA ----
           AI-ja e kap klientin me emër e numër; pastaj kërkesa rri te lista dhe
           ASKUSH s'ia kujton pronarit. Një lead i paprekur 2 ditë është praktikisht
           i humbur — klienti ka blerë gjetkë. Deri tani digest-i i numëronte vetëm
           ata të djeshmit si "blerës të kapur"; askush s'thoshte "këta të presin".
           Kufiri 48 orë: nën të është ende punë normale, mbi të është para që ikin. */
        let cold = 0, coldOldestDays = 0;
        try {
          const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
          const { data: colds } = await supabase.from("leads")
            .select("created_at").eq("business_id", bid).eq("status", "new")
            .lt("created_at", cutoff).order("created_at").limit(200);
          cold = (colds || []).length;
          if (cold) {
            const oldest = new Date(colds[0].created_at).getTime();
            coldOldestDays = Math.max(1, Math.floor((Date.now() - oldest) / 864e5));
          }
        } catch (_e) { /* tabela mund të mungojë → digest-i vazhdon normal */ }

        if (!todayN && !buyers && !cold) continue; // asgjë për të thënë → heshtje (zero bezdi)

        const title = sq ? "☀️ Dita jote sot" : "☀️ Your day today";
        const parts: string[] = [];
        if (todayN) parts.push(sq ? `${todayN} takime sot${firstAt ? ", i pari në " + firstAt : ""}` : `${todayN} bookings today${firstAt ? ", first at " + firstAt : ""}`);
        if (buyers) parts.push(sq ? `dje AI kapi ${buyers} blerës` : `yesterday the AI captured ${buyers} buyer${buyers > 1 ? "s" : ""}`);
        // E fundit dhe më e forta: para që po ikin, me moshën e më të vjetrës
        if (cold) parts.push(sq
          ? `⚠️ ${cold} kërkesa të pakontaktuara (më e vjetra prej ${coldOldestDays} ditësh)`
          : `⚠️ ${cold} request${cold > 1 ? "s" : ""} not contacted yet (oldest ${coldOldestDays}d)`);
        const body = parts.join(" · ");

        await fetch(`${SUPABASE_URL}/functions/v1/push`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: bid, title, body }),
        });
        sent++;
      } catch (_e) { /* një biznes me gabim s'i ndal të tjerët */ }
    }
    return new Response(JSON.stringify({ ok: true, sent }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message || e).slice(0, 200) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
