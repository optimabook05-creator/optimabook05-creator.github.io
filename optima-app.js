/* =====================================================================
   OptimaBook — Aplikacioni real (Faza A)
   Hyrje/regjistrim pronari (Supabase Auth) + të dhëna në databazë.
   Tre pamje: (1) Auth, (2) Regjistrimi i biznesit, (3) Paneli.
   Multi-tenant: RLS siguron që çdo pronar sheh vetëm të dhënat e veta.
   ===================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ---------------- Gjuha ---------------- */
const LANG_KEY = "optimabook_lang";
let lang = localStorage.getItem(LANG_KEY) ||
  ((navigator.language || "").toLowerCase().startsWith("sq") ? "sq" : "en");
if (lang !== "sq" && lang !== "en") lang = "en";

const T = {
  sq: {
    dayNames: ["E diel","E hënë","E martë","E mërkurë","E enjte","E premte","E shtunë"],
    months: ["jan","shk","mar","pri","maj","qer","kor","gus","sht","tet","nën","dhj"],
    authLoginTitle: "Hyr në llogarinë tënde",
    authSignupTitle: "Krijo llogarinë e biznesit",
    email: "Email", password: "Fjalëkalimi",
    login: "Hyr", signup: "Regjistrohu",
    toLogin: "Ke llogari? Hyr",
    toSignup: "S'ke llogari? Regjistrohu falas",
    authWait: "Një moment…",
    confirmEmail: "Të dërguam një email konfirmimi. Hape dhe kliko linkun, pastaj kthehu e hyr.",
    accountExists: "Kjo llogari ekziston tashmë — fute fjalëkalimin dhe kliko Hyr.",
    errWrong: "Email ose fjalëkalim i gabuar.",
    obTitle: "Krijo biznesin tënd",
    obSub: "Gati për klientë në nën 5 minuta.",
    obType: "Lloji i biznesit", obName: "Emri i biznesit", obAddress: "Adresa",
    obServices: "Shërbimet (emri, minutat, çmimi)", addService: "+ Shto shërbim",
    obHours: "Orari i punës", closed: "pushim",
    obFinish: "Përfundo — jam gati ✓", svcNamePh: "Emri i shërbimit",
    logout: "Dil", panelPrefix: "Paneli — ",
    tabCal: "📅 Kalendari", tabAppt: "📋 Takimet", tabBlock: "⛔ Bllokime", tabStat: "📊 Statistika",
    today: "Sot", dayOff: "Ditë pushimi.", free: "I lirë", cont: "↳ vazhdim", blocked: "⛔ Bllokuar",
    confirmed: "konfirmuar", pending: "në pritje",
    addManual: "+ Shto takim manual", emptyAppt: "Asnjë takim ende.",
    bookedAi: "🤖 AI", manual: "✍ manual", confirmedW: "✓ konfirmuar", cancelledW: "anuluar",
    remind: "🔔 Kujto", confirmBtn: "✓ Konfirmo", cancelBtn: "Anulo",
    blockDesc: "Blloko orare kur s'punon.", reasonPh: "Arsyeja (opsionale)", blockBtn: "Blloko",
    emptyBlock: "Asnjë bllokim.", remove: "Hiq",
    statActive: "Takime aktive", statRevenue: "Të ardhura të rezervuara",
    statAi: "Rezervuar nga AI", statConfirmed: "Të konfirmuara",
    manTitle: "Takim manual", manClient: "Emri i klientit", manService: "Shërbimi",
    manDate: "Data", manTime: "Ora", save: "Ruaj", cancel: "Anulo", noSlots: "— s'ka orar të lirë —",
    pickTime: "Zgjidh një orar (dita është plot ose mbyllur).",
    toastSaved: "✅ U ruajt", toastCancelled: "🗑 U anulua", toastConfirmed: "✓ U konfirmua",
    toastBlocked: "⛔ U bllokua", toastRemind: "🔔 Kujtesa u shënua",
    errFields: "Plotëso email-in dhe fjalëkalimin (min. 6 shkronja).",
  },
  en: {
    dayNames: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    authLoginTitle: "Sign in to your account",
    authSignupTitle: "Create your business account",
    email: "Email", password: "Password",
    login: "Sign in", signup: "Sign up",
    toLogin: "Have an account? Sign in",
    toSignup: "No account? Sign up free",
    authWait: "One moment…",
    confirmEmail: "We sent a confirmation email. Open it, click the link, then come back and sign in.",
    accountExists: "This account already exists — enter your password and click Sign in.",
    errWrong: "Wrong email or password.",
    obTitle: "Create your business",
    obSub: "Ready for customers in under 5 minutes.",
    obType: "Business type", obName: "Business name", obAddress: "Address",
    obServices: "Services (name, minutes, price)", addService: "+ Add service",
    obHours: "Working hours", closed: "closed",
    obFinish: "Finish — I'm ready ✓", svcNamePh: "Service name",
    logout: "Sign out", panelPrefix: "Panel — ",
    tabCal: "📅 Calendar", tabAppt: "📋 Appointments", tabBlock: "⛔ Blocks", tabStat: "📊 Stats",
    today: "Today", dayOff: "Day off.", free: "Free", cont: "↳ continues", blocked: "⛔ Blocked",
    confirmed: "confirmed", pending: "pending",
    addManual: "+ Add manual appointment", emptyAppt: "No appointments yet.",
    bookedAi: "🤖 AI", manual: "✍ manual", confirmedW: "✓ confirmed", cancelledW: "cancelled",
    remind: "🔔 Remind", confirmBtn: "✓ Confirm", cancelBtn: "Cancel",
    blockDesc: "Block times when you're off.", reasonPh: "Reason (optional)", blockBtn: "Block",
    emptyBlock: "No blocks.", remove: "Remove",
    statActive: "Active appointments", statRevenue: "Booked revenue",
    statAi: "Booked by AI", statConfirmed: "Confirmed",
    manTitle: "Manual appointment", manClient: "Customer name", manService: "Service",
    manDate: "Date", manTime: "Time", save: "Save", cancel: "Cancel", noSlots: "— no free slots —",
    pickTime: "Pick a time (the day is full or closed).",
    toastSaved: "✅ Saved", toastCancelled: "🗑 Cancelled", toastConfirmed: "✓ Confirmed",
    toastBlocked: "⛔ Blocked", toastRemind: "🔔 Reminder noted",
    errFields: "Enter email and password (min. 6 characters).",
  },
};
const tr = (k) => T[lang][k];

const PRESETS = {
  sq: {
    barber:{label:"💈 Berber",name:"Toni Barber",services:[["Qethje",30,5],["Qethje + Mjekër",45,8]]},
    salon:{label:"💅 Sallon bukurie",name:"Sallon Anna",services:[["Prerje & Styling",60,20],["Ngjyrosje",90,35],["Manikyr",45,12]]},
    dentist:{label:"🦷 Dentist",name:"Klinika Smile",services:[["Kontroll",30,20],["Pastrim",45,40],["Mbushje",60,50]]},
    physio:{label:"💆 Fizioterapi",name:"FizioCare",services:[["Fizioterapi",45,25],["Masazh",60,30]]},
    gym:{label:"🏋️ Palestra",name:"FitZone",services:[["Seancë personale",60,15],["Vlerësim",45,10]]},
    auto:{label:"🚗 Servis makinash",name:"Auto Berti",services:[["Ndërrim vaji",30,25],["Kontroll",60,30]]},
    clinic:{label:"🩺 Klinikë",name:"Klinika Vita",services:[["Konsultë",30,30],["Ekografi",30,40]]},
    restaurant:{label:"🍽 Restorant",name:"Restorant Alba",services:[["Tavolinë 2",90,0],["Tavolinë 4",90,0]]},
    vet:{label:"🐾 Veteriner",name:"Klinika Pet",services:[["Kontroll",30,15],["Vaksinim",20,20]]},
    lawyer:{label:"⚖️ Avokat",name:"Studio Lex",services:[["Konsultë ligjore",60,50]]},
    tattoo:{label:"🎨 Tatuazh",name:"Ink Studio",services:[["Konsultë",30,0],["Seancë",120,80]]},
    photo:{label:"📸 Fotograf",name:"Foto Art",services:[["Portret",60,40],["Event",120,100]]},
    tutor:{label:"📚 Mësues",name:"Qendra Edu",services:[["Orë individuale",60,10]]},
    other:{label:"✨ Tjetër",name:"Biznesi Im",services:[["Shërbim standard",30,10]]},
  },
  en: {
    barber:{label:"💈 Barbershop",name:"Tony's Barbershop",services:[["Haircut",30,15],["Haircut + Beard",45,22]]},
    salon:{label:"💅 Beauty salon",name:"Anna's Salon",services:[["Cut & Styling",60,40],["Coloring",90,70],["Manicure",45,25]]},
    dentist:{label:"🦷 Dentist",name:"Smile Clinic",services:[["Check-up",30,50],["Cleaning",45,80],["Filling",60,120]]},
    physio:{label:"💆 Physio",name:"PhysioCare",services:[["Physiotherapy",45,50],["Massage",60,60]]},
    gym:{label:"🏋️ Gym",name:"FitZone",services:[["Personal session",60,35],["Assessment",45,25]]},
    auto:{label:"🚗 Car service",name:"Bert's Auto",services:[["Oil change",30,45],["Inspection",60,60]]},
    clinic:{label:"🩺 Clinic",name:"Vita Clinic",services:[["Consultation",30,60],["Ultrasound",30,80]]},
    restaurant:{label:"🍽 Restaurant",name:"Alba Restaurant",services:[["Table for 2",90,0],["Table for 4",90,0]]},
    vet:{label:"🐾 Veterinarian",name:"Pet Clinic",services:[["Check-up",30,40],["Vaccination",20,35]]},
    lawyer:{label:"⚖️ Lawyer",name:"Lex Law",services:[["Legal consultation",60,120]]},
    tattoo:{label:"🎨 Tattoo",name:"Ink Studio",services:[["Consultation",30,0],["Session",120,150]]},
    photo:{label:"📸 Photographer",name:"Art Photo",services:[["Portrait",60,90],["Event",120,200]]},
    tutor:{label:"📚 Tutor",name:"Edu Center",services:[["Private lesson",60,30]]},
    other:{label:"✨ Other",name:"My Business",services:[["Standard service",30,20]]},
  },
};

/* ---------------- Helpers ---------------- */
const $ = (s) => document.querySelector(s);
const pad = (n) => String(n).padStart(2, "0");
const hm = (t) => (t ? t.slice(0, 5) : t);                 // "09:00:00" -> "09:00"
const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const SLOT_STEP = 30;
let toastTimer;
function toast(text) {
  const el = $("#toast"); if (!el) return;
  el.textContent = text; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function humanDate(ds) {
  const d = parseDate(ds), today = fmtDate(new Date());
  const tom = fmtDate(new Date(Date.now() + 864e5));
  const dn = T[lang].dayNames[d.getDay()];
  let label = `${lang === "sq" ? dn.toLowerCase() : dn}, ${d.getDate()} ${T[lang].months[d.getMonth()]}`;
  if (ds === today) label = (lang === "sq" ? "sot" : "today") + " · " + label;
  else if (ds === tom) label = (lang === "sq" ? "nesër" : "tomorrow") + " · " + label;
  return label;
}

/* ---------------- Gjendja ---------------- */
let biz = null;            // {id, name, type, address}
let services = [];         // [{id, name, duration_min, price}]
let hours = {};            // weekday -> {open, close} ose null
let calDate = fmtDate(new Date());

/* =====================================================================
   AUTH
   ===================================================================== */
let authMode = "signup";   // ose "login"

function renderAuthMode() {
  $("#authTitle").textContent = authMode === "signup" ? tr("authSignupTitle") : tr("authLoginTitle");
  $("#authSubmit").textContent = authMode === "signup" ? tr("signup") : tr("login");
  $("#authToggle").textContent = authMode === "signup" ? tr("toLogin") : tr("toSignup");
  // Shënim: nuk e fshijmë authError këtu — disa mesazhe duhet të mbeten pas rirenderimit.
}

// Llogaria ekziston: kalo te hyrja, mbaj email-in, trego mesazhin
function switchToLoginExisting(email) {
  authMode = "login";
  renderAuthMode();
  $("#authEmail").value = email;
  const err = $("#authError");
  err.style.color = "var(--accent-deep)";
  err.textContent = tr("accountExists");
  $("#authPassword").value = "";
  $("#authPassword").focus();
}

function showView(which) {
  $("#authView").hidden = which !== "auth";
  $("#onboardView").hidden = which !== "onboard";
  $("#appView").hidden = which !== "app";
  $("#btnLogout").hidden = which === "auth"; // "Dil" shfaqet kur je brenda
}

async function handleAuth(e) {
  e.preventDefault();
  const email = $("#authEmail").value.trim();
  const pass = $("#authPassword").value;
  const err = $("#authError");
  err.style.color = "var(--red)";
  err.textContent = "";
  if (!email || pass.length < 6) { err.textContent = tr("errFields"); return; }

  $("#authSubmit").disabled = true;
  $("#authSubmit").textContent = tr("authWait");
  try {
    if (authMode === "signup") {
      const { data, error } = await sb.auth.signUp({ email, password: pass });
      if (error) {
        // Llogaria ekziston tashmë → drejtoje te hyrja
        if (/already|registered|exists/i.test(error.message)) { switchToLoginExisting(email); return; }
        throw error;
      }
      // Anti-enumeration i Supabase: përdoruesi ekzistues kthehet me identities bosh
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        switchToLoginExisting(email); return;
      }
      if (!data.session) { // llogari e re që kërkon konfirmim email-i
        err.style.color = "var(--accent-deep)";
        err.textContent = tr("confirmEmail");
        return;
      }
      await afterLogin();
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) {
        if (/invalid login|credentials/i.test(error.message)) { err.textContent = tr("errWrong"); return; }
        throw error;
      }
      await afterLogin();
    }
  } catch (ex) {
    err.style.color = "var(--red)";
    err.textContent = ex.message || String(ex);
  } finally {
    $("#authSubmit").disabled = false;
    renderAuthMode();
  }
}

async function afterLogin() {
  await loadBusiness();
  if (biz) { await loadAll(); showView("app"); }
  else { openOnboard(); showView("onboard"); }
}

async function logout() {
  await sb.auth.signOut();
  biz = null; services = []; hours = {};
  showView("auth");
}

/* =====================================================================
   DATA
   ===================================================================== */
async function loadBusiness() {
  // Gjithmonë biznesi i parë (më i vjetri) — i njëjti panel çdo herë
  const { data } = await sb.from("businesses").select("*")
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  biz = data || null;
}

async function loadServices() {
  const { data } = await sb.from("services").select("*").eq("business_id", biz.id)
    .eq("active", true).order("sort_order");
  services = data || [];
}

async function loadHours() {
  const { data } = await sb.from("working_hours").select("*").eq("business_id", biz.id);
  hours = {};
  for (let i = 0; i < 7; i++) hours[i] = null;
  (data || []).forEach((r) => {
    hours[r.weekday] = r.is_closed ? null : { open: hm(r.open_time), close: hm(r.close_time) };
  });
}

async function loadAll() {
  await Promise.all([loadServices(), loadHours()]);
  $("#bizName").textContent = tr("panelPrefix") + biz.name;
  await renderAll();
}

async function apptsForDate(ds) {
  const { data } = await sb.from("appointments").select("*")
    .eq("business_id", biz.id).eq("appt_date", ds).neq("status", "cancelled");
  return data || [];
}
async function blocksForDate(ds) {
  const { data } = await sb.from("time_blocks").select("*")
    .eq("business_id", biz.id).eq("block_date", ds);
  return data || [];
}

/* ---------------- Motori i orareve të lira ---------------- */
function svcById(id) { return services.find((s) => s.id === id); }

// includePast=true lejon pronarin të shënojë takime manuale në çdo orar të ditës
// (p.sh. një klient që sapo erdhi). Klienti/AI s'merr kurrë orare të shkuara.
async function freeSlots(ds, durMin, includePast = false) {
  const d = parseDate(ds);
  const h = hours[d.getDay()];
  if (!h) return [];
  const open = toMin(h.open), close = toMin(h.close);
  const appts = await apptsForDate(ds);
  const blocks = await blocksForDate(ds);
  const busy = appts.map((a) => {
    const s = svcById(a.service_id);
    return [toMin(hm(a.appt_time)), toMin(hm(a.appt_time)) + (s ? s.duration_min : SLOT_STEP)];
  }).concat(blocks.map((b) => [toMin(hm(b.from_time)), toMin(hm(b.to_time))]));
  const isToday = ds === fmtDate(new Date());
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const out = [];
  for (let t = open; t + durMin <= close; t += SLOT_STEP) {
    if (!includePast && isToday && t <= nowM) continue;
    if (!busy.some(([s, e]) => t < e && t + durMin > s)) out.push(toHM(t));
  }
  return out;
}

/* =====================================================================
   ONBOARDING
   ===================================================================== */
function fillTypeSelect(sel) {
  const p = PRESETS[lang];
  sel.innerHTML = Object.keys(p).map((k) => `<option value="${k}">${p[k].label}</option>`).join("");
}
function addServiceRow(s) {
  const row = document.createElement("div");
  row.className = "service-row";
  row.innerHTML = `
    <input class="s-name" type="text" placeholder="${tr("svcNamePh")}" value="${s ? s[0] : ""}" maxlength="40">
    <input class="s-dur" type="number" min="10" max="240" step="5" value="${s ? s[1] : 30}">
    <input class="s-price" type="number" min="0" step="0.5" value="${s ? s[2] : 0}">
    <button class="s-del" type="button">✕</button>`;
  row.querySelector(".s-del").onclick = () => row.remove();
  $("#obServices").appendChild(row);
}
function openOnboard() {
  const sel = $("#obType");
  fillTypeSelect(sel);
  const applyPreset = () => {
    const p = PRESETS[lang][sel.value];
    $("#obName").value = p.name;
    $("#obServices").innerHTML = "";
    p.services.forEach(addServiceRow);
  };
  sel.onchange = applyPreset;
  applyPreset();
  // orari
  const hb = $("#obHours"); hb.innerHTML = "";
  for (let i = 1; i <= 7; i++) {
    const dow = i % 7;
    const closed = dow === 0;
    const row = document.createElement("div");
    row.className = "hours-row"; row.dataset.dow = dow;
    row.innerHTML = `
      <span class="day">${T[lang].dayNames[dow]}</span>
      <input type="time" class="h-open" value="09:00" ${closed ? "disabled" : ""}>
      <span>–</span>
      <input type="time" class="h-close" value="19:00" ${closed ? "disabled" : ""}>
      <label class="closed-toggle"><input type="checkbox" class="h-closed" ${closed ? "checked" : ""}> ${tr("closed")}</label>`;
    row.querySelector(".h-closed").addEventListener("change", (e) => {
      row.querySelector(".h-open").disabled = e.target.checked;
      row.querySelector(".h-close").disabled = e.target.checked;
    });
    hb.appendChild(row);
  }
}

async function finishOnboard() {
  const btn = $("#obFinish");
  const name = $("#obName").value.trim() || PRESETS[lang][$("#obType").value].name;
  const svcRows = [...document.querySelectorAll("#obServices .service-row")]
    .map((r) => ({
      name: r.querySelector(".s-name").value.trim(),
      duration_min: Math.max(10, +r.querySelector(".s-dur").value || 30),
      price: +r.querySelector(".s-price").value || 0,
    })).filter((s) => s.name);
  if (!svcRows.length) { addServiceRow(null); return; }

  btn.disabled = true; btn.textContent = tr("authWait");
  try {
    // Mbrojtje nga dublikatat: nëse biznesi ekziston tashmë, hap panelin
    await loadBusiness();
    if (biz) { await loadAll(); showView("app"); return; }

    const { data: { user } } = await sb.auth.getUser();
    const { data: b, error } = await sb.from("businesses").insert({
      owner_id: user.id, name, type: $("#obType").value,
      address: $("#obAddress").value.trim(), lang,
    }).select().single();
    if (error) throw error;
    biz = b;

    await sb.from("services").insert(svcRows.map((s, i) => ({ ...s, business_id: b.id, sort_order: i })));
    const hrows = [...document.querySelectorAll("#obHours .hours-row")].map((r) => {
      const closed = r.querySelector(".h-closed").checked;
      return {
        business_id: b.id, weekday: +r.dataset.dow, is_closed: closed,
        open_time: closed ? null : r.querySelector(".h-open").value,
        close_time: closed ? null : r.querySelector(".h-close").value,
      };
    });
    await sb.from("working_hours").insert(hrows);

    await loadAll();
    showView("app");
    toast(tr("toastSaved"));
  } catch (ex) {
    alert(ex.message || String(ex));
  } finally {
    btn.disabled = false; btn.textContent = tr("obFinish");
  }
}

/* =====================================================================
   PANELI
   ===================================================================== */
async function renderAll() {
  await Promise.all([renderCalendar(), renderAppointments(), renderBlocks(), renderStats()]);
}

async function renderCalendar() {
  const d = parseDate(calDate);
  $("#calLabel").textContent = `${T[lang].dayNames[d.getDay()]}, ${d.getDate()} ${T[lang].months[d.getMonth()]} ${d.getFullYear()}`;
  const tl = $("#timeline"); tl.innerHTML = "";
  const h = hours[d.getDay()];
  if (!h) { tl.innerHTML = `<div class="empty">${tr("dayOff")}</div>`; return; }
  const open = toMin(h.open), close = toMin(h.close);
  const appts = await apptsForDate(calDate);
  const blocks = await blocksForDate(calDate);
  for (let t = open; t < close; t += SLOT_STEP) {
    const row = document.createElement("div");
    const appt = appts.find((a) => {
      const s = svcById(a.service_id); const st = toMin(hm(a.appt_time));
      return t >= st && t < st + (s ? s.duration_min : SLOT_STEP);
    });
    const block = blocks.find((b) => t >= toMin(hm(b.from_time)) && t < toMin(hm(b.to_time)));
    if (appt) {
      const s = svcById(appt.service_id); const isStart = toMin(hm(appt.appt_time)) === t;
      row.className = "slot busy";
      row.innerHTML = `<span class="time">${toHM(t)}</span>
        <span class="label">${isStart ? `<strong>${esc(appt.client_name)}</strong> — ${s ? esc(s.name) : ""}` : tr("cont")}</span>
        ${isStart ? `<span class="tag ${appt.status === "confirmed" ? "confirmed" : "pending"}">${appt.status === "confirmed" ? tr("confirmed") : tr("pending")}</span>` : ""}`;
    } else if (block) {
      row.className = "slot blocked";
      row.innerHTML = `<span class="time">${toHM(t)}</span><span class="label">${tr("blocked")}${block.reason ? " — " + esc(block.reason) : ""}</span>`;
    } else {
      row.className = "slot free";
      row.innerHTML = `<span class="time">${toHM(t)}</span><span class="label">${tr("free")}</span>`;
    }
    tl.appendChild(row);
  }
}

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

async function renderAppointments() {
  const list = $("#apptList"); list.innerHTML = "";
  const today = fmtDate(new Date());
  const { data } = await sb.from("appointments").select("*").eq("business_id", biz.id)
    .gte("appt_date", today).order("appt_date").order("appt_time");
  const appts = data || [];
  if (!appts.length) { list.innerHTML = `<div class="empty">${tr("emptyAppt")}</div>`; return; }
  for (const a of appts) {
    const s = svcById(a.service_id); const d = parseDate(a.appt_date);
    const card = document.createElement("div");
    card.className = "appt-card" + (a.status === "cancelled" ? " cancelled" : "");
    card.innerHTML = `
      <div class="appt-when">${hm(a.appt_time)}<small>${d.getDate()} ${T[lang].months[d.getMonth()]}</small></div>
      <div class="appt-info">
        <div class="who">${esc(a.client_name)}</div>
        <div class="what">${s ? esc(s.name) + " • " + s.price + "€" : ""} • ${a.source === "ai" ? tr("bookedAi") : tr("manual")}
          ${a.status === "confirmed" ? ` • <span style="color:var(--accent-deep)">${tr("confirmedW")}</span>` : ""}
          ${a.status === "cancelled" ? ` • <span style="color:var(--red)">${tr("cancelledW")}</span>` : ""}
        </div>
      </div>
      <div class="appt-actions"></div>`;
    const act = card.querySelector(".appt-actions");
    if (a.status !== "cancelled") {
      if (a.status !== "confirmed") {
        const c = document.createElement("button");
        c.className = "btn small"; c.textContent = tr("confirmBtn");
        c.onclick = () => setStatus(a.id, "confirmed");
        act.appendChild(c);
      }
      const x = document.createElement("button");
      x.className = "btn small ghost danger"; x.textContent = tr("cancelBtn");
      x.onclick = () => setStatus(a.id, "cancelled");
      act.appendChild(x);
    }
    list.appendChild(card);
  }
}

async function setStatus(id, status) {
  await sb.from("appointments").update({ status }).eq("id", id);
  toast(status === "cancelled" ? tr("toastCancelled") : tr("toastConfirmed"));
  await renderAll();
}

async function renderBlocks() {
  const list = $("#blockList"); list.innerHTML = "";
  const { data } = await sb.from("time_blocks").select("*").eq("business_id", biz.id)
    .order("block_date").order("from_time");
  const blocks = data || [];
  if (!blocks.length) { list.innerHTML = `<div class="empty">${tr("emptyBlock")}</div>`; return; }
  for (const b of blocks) {
    const item = document.createElement("div");
    item.className = "block-item";
    item.innerHTML = `<span class="grow">⛔ ${humanDate(b.block_date)} • ${hm(b.from_time)}–${hm(b.to_time)}${b.reason ? " — " + esc(b.reason) : ""}</span>`;
    const del = document.createElement("button");
    del.className = "btn small ghost danger"; del.textContent = tr("remove");
    del.onclick = async () => { await sb.from("time_blocks").delete().eq("id", b.id); await renderAll(); };
    item.appendChild(del);
    list.appendChild(item);
  }
}

async function renderStats() {
  const { data } = await sb.from("appointments").select("service_id,status,source").eq("business_id", biz.id);
  const appts = data || [];
  const active = appts.filter((a) => a.status !== "cancelled");
  const revenue = active.reduce((s, a) => { const v = svcById(a.service_id); return s + (v ? Number(v.price) : 0); }, 0);
  const ai = appts.filter((a) => a.source === "ai" && a.status !== "cancelled").length;
  const conf = appts.filter((a) => a.status === "confirmed").length;
  $("#statsGrid").innerHTML = `
    <div class="stat-card"><div class="num">${active.length}</div><div class="lbl">${tr("statActive")}</div></div>
    <div class="stat-card highlight"><div class="num">${revenue}€</div><div class="lbl">${tr("statRevenue")}</div></div>
    <div class="stat-card"><div class="num">${ai}</div><div class="lbl">${tr("statAi")}</div></div>
    <div class="stat-card highlight"><div class="num">${conf}</div><div class="lbl">${tr("statConfirmed")}</div></div>`;
}

/* ---------------- Takim manual ---------------- */
async function openManual() {
  $("#manService").innerHTML = services.map((s) => `<option value="${s.id}">${esc(s.name)} (${s.duration_min} min)</option>`).join("");
  $("#manDate").value = calDate;
  await refreshManTimes();
  $("#manModal").hidden = false;
  setTimeout(() => $("#manClient").focus(), 60);
}
async function refreshManTimes() {
  const s = svcById($("#manService").value);
  const slots = s && $("#manDate").value ? await freeSlots($("#manDate").value, s.duration_min, true) : [];
  $("#manTime").innerHTML = slots.length ? slots.map((x) => `<option>${x}</option>`).join("")
    : `<option value="">${tr("noSlots")}</option>`;
}
async function saveManual() {
  const client = $("#manClient").value.trim();
  const time = $("#manTime").value;
  if (!client) { $("#manClient").focus(); return; }
  if (!time) { toast(tr("pickTime")); return; }
  await sb.from("appointments").insert({
    business_id: biz.id, service_id: $("#manService").value,
    client_name: client, appt_date: $("#manDate").value, appt_time: time,
    status: "pending", source: "manual",
  });
  $("#manModal").hidden = true; $("#manClient").value = "";
  toast(tr("toastSaved"));
  await renderAll();
}

/* =====================================================================
   GJUHA + WIRING
   ===================================================================== */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("#langSwitch button").forEach((b) =>
    b.classList.toggle("active", b.dataset.l === lang));
  document.querySelectorAll("[data-t]").forEach((el) => {
    const v = T[lang][el.dataset.t]; if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll("[data-t-ph]").forEach((el) => {
    const v = T[lang][el.dataset.tPh]; if (v !== undefined) el.placeholder = v;
  });
  renderAuthMode();
}

function wire() {
  document.querySelectorAll("#langSwitch button").forEach((b) => {
    b.onclick = () => { lang = b.dataset.l; localStorage.setItem(LANG_KEY, lang); applyLang();
      if (!$("#onboardView").hidden) openOnboard();
      if (!$("#appView").hidden && biz) loadAll(); };
  });
  $("#authForm").addEventListener("submit", handleAuth);
  $("#authToggle").onclick = () => {
    authMode = authMode === "signup" ? "login" : "signup";
    $("#authError").textContent = "";
    renderAuthMode();
  };
  $("#obAddService").onclick = () => addServiceRow(null);
  $("#obFinish").onclick = finishOnboard;
  $("#btnLogout").onclick = logout;
  $("#calPrev").onclick = () => { const d = parseDate(calDate); d.setDate(d.getDate() - 1); calDate = fmtDate(d); renderCalendar(); };
  $("#calNext").onclick = () => { const d = parseDate(calDate); d.setDate(d.getDate() + 1); calDate = fmtDate(d); renderCalendar(); };
  $("#calToday").onclick = () => { calDate = fmtDate(new Date()); renderCalendar(); };
  $("#btnAddAppt").onclick = openManual;
  $("#manService").onchange = refreshManTimes;
  $("#manDate").onchange = refreshManTimes;
  $("#manCancel").onclick = () => { $("#manModal").hidden = true; };
  $("#manSave").onclick = saveManual;
  $("#manModal").addEventListener("click", (e) => { if (e.target === $("#manModal")) $("#manModal").hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#manModal").hidden) $("#manModal").hidden = true; });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((x) => x.classList.remove("active"));
      tab.classList.add("active");
      $("#pane-" + tab.dataset.tab).classList.add("active");
    };
  });
  $("#blockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const from = $("#blockFrom").value, to = $("#blockTo").value;
    if (!from || !to || toMin(to) <= toMin(from)) return;
    await sb.from("time_blocks").insert({
      business_id: biz.id, block_date: $("#blockDate").value,
      from_time: from, to_time: to, reason: $("#blockReason").value.trim() || null,
    });
    e.target.reset(); toast(tr("toastBlocked")); await renderAll();
  });
}

/* ---------------- Nisja ---------------- */
async function init() {
  applyLang();
  wire();
  const { data: { session } } = await sb.auth.getSession();
  if (session) { await afterLogin(); }
  else { showView("auth"); }
}
init();
