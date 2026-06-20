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
    obServices: "Shërbimet (emër, kohëzgjatje, çmim)", addService: "+ Shto shërbim",
    unitMin: "min", unitHour: "orë", unitDay: "ditë", unitWeek: "javë", unitMonth: "muaj", unitYear: "vit", unitNone: "— pa kohë",
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
    tabWait: "⏳ Lista e pritjes",
    waitDesc: "Klientët që presin një orar. AI i lajmëron vetë kur lirohet një orar.",
    emptyWait: "Asnjë në listën e pritjes.", waitWaiting: "në pritje", waitNotified: "u lajmërua",
    periodAny: "çdo orë", periodMorning: "paradite", periodAfternoon: "pasdite", periodEvening: "mbrëmje",
    reviewUrlLbl: "⭐ Linku i vlerësimeve Google (për kërkesa automatike pas takimit)",
    aiNotesLbl: "🧠 Info për AI-në (paketa, çmime, kohë dorëzimi, politika — AI ua thotë klientëve)",
    aiNotesPh: "P.sh. Web 1-3 faqe = 100€, dorëzim ~13 ditë. Web 4-7 faqe = 200€, ~30 ditë.",
    modeLbl: "⚙️ Mënyra e biznesit (ndize/fike kurdo)",
    tabSettings: "⚙️ Cilësime", settingsDesc: "Ndrysho gjithçka kurdo — pa rifilluar.",
    setBizH: "Biznesi", setNameLbl: "Emri & adresa", setSvcH: "Shërbimet / Produktet",
    setHoursH: "Orari i punës", setAiH: "AI & Vlerësime",
    saveServicesBtn: "Ruaj shërbimet", saveHoursBtn: "Ruaj orarin", deliveryPh: "p.sh. 13 ditë",
    aiActive: "AI aktiv · 24/7",
    tabActivity: "🔔 Aktiviteti", activityDesc: "Çdo gjë që bën AI: rezervime, anulime, kujtesa, kërkesa — live.", emptyActivity: "Ende pa aktivitet.",
    tabCustomers: "👤 Klientët", customersDesc: "Klientët e tu, vizitat dhe të ardhurat — të mbledhura vetë nga AI.", searchPh: "Kërko klient…", emptyCustomers: "Ende pa klientë.",
    setChannelH: "🔗 Lidh kanalin (Telegram)", channelDesc: "2 minuta: krijo një bot te @BotFather → kopjo token-in → ngjite këtu → Ruaj → kliko \"Aktivizo\".",
    tgTokenLbl: "Token-i i bot-it Telegram", tgActivate: "⚡ Aktivizo webhook-un ↗", bizIdLbl: "ID e biznesit (për WhatsApp/Meta):",
    tabStaff: "👥 Stafi", staffDesc: "Shto staf dhe lokacione. Çdo person pret klientë paralelisht në të njëjtën orë.",
    locNamePh: "Emri i lokacionit", locAddrPh: "Adresa (opsionale)", addLoc: "+ Lokacion",
    staffNamePh: "Emri i personit", staffRolePh: "Roli (p.sh. berber)", addStaff: "+ Staf",
    manStaff: "Stafi", emptyStaff: "Asnjë staf — biznes me një person.", emptyLoc: "Asnjë lokacion.",
    allStaff: "Të gjithë stafin", noLoc: "Pa lokacion",
    obModeLbl: "Si punon biznesi?", obModeAppt: "📅 Bëj takime (me kalendar)", obModeInquiry: "🛒 Marr porosi/kërkesa (pa kalendar)",
    tabLeads: "📥 Kërkesa", leadsDesc: "Kërkesat/porositë e klientëve (për biznese pa takime). AI i merr vetë 24/7.",
    emptyLeads: "Asnjë kërkesë ende.", leadNew: "e re", leadContacted: "u kontaktua", markContacted: "Shëno si kontaktuar",
    statActive: "Takime aktive", statRevenue: "Të ardhura të rezervuara",
    statAi: "Rezervuar nga AI", statConfirmed: "Të konfirmuara",
    statThisMonth: "Të ardhura këtë muaj", statVsLast: "vs muaji i kaluar",
    statPeakDay: "Dita më e ngarkuar", statPeakHour: "Ora e pikut",
    statCancelRate: "Norma e anulimeve", statAiShare: "Punon AI për ty",
    statNoShow: "rrezik mungese", secInsights: "Çfarë të thotë biznesi",
    secTopServices: "Shërbimet më të kërkuara", secVip: "Klientët më besnikë",
    secLoad: "Ngarkesa — 7 ditët e ardhshme", visitsW: "vizita", bookingsW: "rezervime",
    statNoData: "Ende pa të dhëna — sapo të vijnë takimet, këtu shfaqet analiza e biznesit tënd.",
    aiSaved: "takime të zëna nga AI pa ty", revTrendUp: "rritje", revTrendDown: "rënie", revTrendFlat: "njësoj",
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
    obServices: "Services (name, duration, price)", addService: "+ Add service",
    unitMin: "min", unitHour: "hours", unitDay: "days", unitWeek: "weeks", unitMonth: "months", unitYear: "years", unitNone: "— none",
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
    tabWait: "⏳ Waiting list",
    waitDesc: "Customers waiting for a slot. AI notifies them automatically when one frees up.",
    emptyWait: "No one waiting.", waitWaiting: "waiting", waitNotified: "notified",
    periodAny: "any time", periodMorning: "morning", periodAfternoon: "afternoon", periodEvening: "evening",
    reviewUrlLbl: "⭐ Google review link (for automatic requests after the appointment)",
    aiNotesLbl: "🧠 Info for the AI (packages, prices, delivery times, policies — AI tells customers)",
    aiNotesPh: "E.g. Website 1-3 pages = 100€, delivered in ~13 days. 4-7 pages = 200€, ~30 days.",
    modeLbl: "⚙️ Business mode (turn on/off anytime)",
    tabSettings: "⚙️ Settings", settingsDesc: "Change anything anytime — no need to restart.",
    setBizH: "Business", setNameLbl: "Name & address", setSvcH: "Services / Products",
    setHoursH: "Working hours", setAiH: "AI & Reviews",
    saveServicesBtn: "Save services", saveHoursBtn: "Save hours", deliveryPh: "e.g. 13 days",
    aiActive: "AI active · 24/7",
    tabActivity: "🔔 Activity", activityDesc: "Everything the AI does: bookings, cancellations, reminders, requests — live.", emptyActivity: "No activity yet.",
    tabCustomers: "👤 Customers", customersDesc: "Your customers, visits and revenue — gathered automatically by the AI.", searchPh: "Search customer…", emptyCustomers: "No customers yet.",
    setChannelH: "🔗 Connect channel (Telegram)", channelDesc: "2 minutes: create a bot at @BotFather → copy the token → paste here → Save → click \"Activate\".",
    tgTokenLbl: "Telegram bot token", tgActivate: "⚡ Activate webhook ↗", bizIdLbl: "Business ID (for WhatsApp/Meta):",
    tabStaff: "👥 Staff", staffDesc: "Add staff and locations. Each person serves customers in parallel at the same time.",
    locNamePh: "Location name", locAddrPh: "Address (optional)", addLoc: "+ Location",
    staffNamePh: "Person's name", staffRolePh: "Role (e.g. barber)", addStaff: "+ Staff",
    manStaff: "Staff", emptyStaff: "No staff — single-person business.", emptyLoc: "No locations.",
    allStaff: "All staff", noLoc: "No location",
    obModeLbl: "How does your business work?", obModeAppt: "📅 I take appointments (calendar)", obModeInquiry: "🛒 I take orders/requests (no calendar)",
    tabLeads: "📥 Requests", leadsDesc: "Customer requests/orders (for businesses without appointments). The AI captures them 24/7.",
    emptyLeads: "No requests yet.", leadNew: "new", leadContacted: "contacted", markContacted: "Mark contacted",
    statActive: "Active appointments", statRevenue: "Booked revenue",
    statAi: "Booked by AI", statConfirmed: "Confirmed",
    statThisMonth: "Revenue this month", statVsLast: "vs last month",
    statPeakDay: "Busiest day", statPeakHour: "Peak hour",
    statCancelRate: "Cancellation rate", statAiShare: "AI works for you",
    statNoShow: "no-show risk", secInsights: "What your business tells you",
    secTopServices: "Top services", secVip: "Most loyal clients",
    secLoad: "Load — next 7 days", visitsW: "visits", bookingsW: "bookings",
    statNoData: "No data yet — once appointments arrive, your business analytics appear here.",
    aiSaved: "appointments handled by AI without you", revTrendUp: "up", revTrendDown: "down", revTrendFlat: "flat",
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
let staff = [];            // [{id, name, role, location_id}] — bosh = biznes me një person
let locations = [];        // [{id, name, address}]
let calStaff = null;       // filtri i kalendarit (id stafi) ose null = të gjithë
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
  if (biz) { showView("app"); await loadAll(); }   // shfaq panelin së pari → s'mbetet kurrë bosh
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

// Stafi/lokacionet — tabela mund të mos ekzistojnë para enterprise.sql → trajtohet si biznes me një person.
async function loadStaff() {
  const { data } = await sb.from("staff").select("*").eq("business_id", biz.id).eq("active", true).order("sort_order").order("created_at");
  staff = data || [];
}
async function loadLocations() {
  const { data } = await sb.from("locations").select("*").eq("business_id", biz.id).order("sort_order").order("created_at");
  locations = data || [];
}

async function loadAll() {
  await Promise.all([loadServices(), loadHours(), loadStaff(), loadLocations()]);
  $("#bizName").textContent = tr("panelPrefix") + biz.name;
  const ru = $("#reviewUrl"); if (ru) ru.value = biz.review_url || "";
  const an = $("#aiNotes"); if (an) an.value = biz.ai_notes || "";
  const bm = $("#bizMode"); if (bm) bm.value = biz.mode || "appointments";
  setupStaffUI();
  applyModeUI();
  renderSettings();
  await renderAll();
}

// Përgatit selektorët e stafit (filtri i kalendarit + fusha te takimi manual)
function setupStaffUI() {
  const has = staff.length > 0;
  const cs = $("#calStaff");
  if (cs) {
    cs.hidden = !has;
    if (has) {
      if (calStaff && !staff.some((s) => s.id === calStaff)) calStaff = null;
      cs.innerHTML = `<option value="">${tr("allStaff")}</option>` + staff.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
      cs.value = calStaff || "";
    } else { calStaff = null; }
  }
  const mf = $("#manStaffField"); if (mf) mf.hidden = !has;
}

// Mënyra e biznesit: fsheh/shfaq skedat sipas takime vs porosi (inquiry)
function applyModeUI() {
  const inquiry = !!(biz && biz.mode === "inquiry");
  const apptTabs = ["calendar", "appointments", "blocks", "waitlist", "staff", "customers"];
  document.querySelectorAll(".tabs .tab").forEach((t) => {
    const tab = t.dataset.tab;
    if (apptTabs.includes(tab)) t.hidden = inquiry;
    else if (tab === "leads") t.hidden = !inquiry;
  });
  const shb = $("#setHoursBlock"); if (shb) shb.hidden = inquiry; // orari pune s'duhet për porosi
  const active = document.querySelector(".tab.active");
  if (active && active.hidden) {
    const fb = document.querySelector('.tab[data-tab="stats"]') || document.querySelector(".tab:not([hidden])");
    if (fb) fb.click();
  }
}

/* ---------------- Cilësimet (edito gjithçka pas regjistrimit) ---------------- */
function setServiceRow(s) {
  const row = document.createElement("div");
  row.className = "service-row";
  if (s && s.id) row.dataset.id = s.id;
  const nameI = document.createElement("input");
  nameI.className = "s-name"; nameI.type = "text"; nameI.maxLength = 40; nameI.placeholder = tr("svcNamePh"); nameI.value = s ? s.name : "";
  const durI = document.createElement("input");
  durI.className = "s-dur"; durI.type = "number"; durI.min = 0; durI.step = 1;
  durI.value = s ? (s.duration_value != null ? s.duration_value : s.duration_min) : 30;
  const unitS = document.createElement("select");
  unitS.className = "s-unit"; unitS.innerHTML = unitOptions(s && s.duration_unit ? s.duration_unit : "min");
  const priceI = document.createElement("input");
  priceI.className = "s-price"; priceI.type = "number"; priceI.min = 0; priceI.step = 0.5; priceI.value = s ? s.price : 0;
  const del = document.createElement("button");
  del.className = "s-del"; del.type = "button"; del.textContent = "✕"; del.onclick = () => row.remove();
  row.append(nameI, durI, unitS, priceI, del);
  $("#setServices").appendChild(row);
}

function renderSettingsHours() {
  const hb = $("#setHours"); if (!hb) return;
  hb.innerHTML = "";
  for (let i = 1; i <= 7; i++) {
    const dow = i % 7;
    const h = hours[dow];
    const closed = !h;
    const row = document.createElement("div");
    row.className = "hours-row"; row.dataset.dow = dow;
    row.innerHTML = `
      <span class="day">${T[lang].dayNames[dow]}</span>
      <input type="time" class="h-open" value="${h ? h.open : "09:00"}" ${closed ? "disabled" : ""}>
      <span>–</span>
      <input type="time" class="h-close" value="${h ? h.close : "19:00"}" ${closed ? "disabled" : ""}>
      <label class="closed-toggle"><input type="checkbox" class="h-closed" ${closed ? "checked" : ""}> ${tr("closed")}</label>`;
    row.querySelector(".h-closed").addEventListener("change", (e) => {
      row.querySelector(".h-open").disabled = e.target.checked;
      row.querySelector(".h-close").disabled = e.target.checked;
    });
    hb.appendChild(row);
  }
}

function renderSettings() {
  if (!biz) return;
  const sn = $("#setName"); if (sn) sn.value = biz.name || "";
  const sa = $("#setAddress"); if (sa) sa.value = biz.address || "";
  const sc = $("#setServices"); if (sc) { sc.innerHTML = ""; services.forEach(setServiceRow); }
  const tg = $("#tgToken"); if (tg) tg.value = biz.telegram_token || "";
  const bid = $("#bizIdVal"); if (bid) bid.textContent = biz.id;
  updateTgWebhookLink();
  renderSettingsHours();
}

// Lidhja Telegram: ndërton linkun e setWebhook (e hap pronari në një tab të ri)
function updateTgWebhookLink() {
  const link = $("#tgWebhook"); if (!link || !biz) return;
  const token = ($("#tgToken") && $("#tgToken").value.trim()) || "";
  if (!token) { link.hidden = true; return; }
  const webhook = `${SUPABASE_URL}/functions/v1/telegram?business_id=${biz.id}`;
  link.href = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhook)}`;
  link.hidden = false;
}

async function saveServicesEdit() {
  const rows = [...document.querySelectorAll("#setServices .service-row")];
  const seen = new Set();
  let i = 0;
  for (const r of rows) {
    const name = r.querySelector(".s-name").value.trim();
    if (!name) continue;
    const unit = r.querySelector(".s-unit") ? r.querySelector(".s-unit").value : "min";
    const value = Math.max(0, +r.querySelector(".s-dur").value || 0);
    const duration_min = durToMin(value, unit);
    const price = +r.querySelector(".s-price").value || 0;
    const rowData = { name, duration_min, duration_value: value, duration_unit: unit, price, sort_order: i, active: true };
    if (r.dataset.id) {
      await sb.from("services").update(rowData).eq("id", r.dataset.id);
      seen.add(r.dataset.id);
    } else {
      await sb.from("services").insert({ business_id: biz.id, ...rowData });
    }
    i++;
  }
  for (const s of services) if (!seen.has(s.id)) await sb.from("services").update({ active: false }).eq("id", s.id);
  await loadServices();
  renderSettings();
  await renderAll();
  toast(tr("toastSaved"));
}

async function saveHoursEdit() {
  const rows = [...document.querySelectorAll("#setHours .hours-row")];
  for (const r of rows) {
    const dow = +r.dataset.dow;
    const closed = r.querySelector(".h-closed").checked;
    await sb.from("working_hours").upsert({
      business_id: biz.id, weekday: dow, is_closed: closed,
      open_time: closed ? null : r.querySelector(".h-open").value,
      close_time: closed ? null : r.querySelector(".h-close").value,
    }, { onConflict: "business_id,weekday" });
  }
  await loadHours();
  renderSettingsHours();
  await renderAll();
  toast(tr("toastSaved"));
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
async function freeSlots(ds, durMin, includePast = false, staffId = null) {
  const d = parseDate(ds);
  const h = hours[d.getDay()];
  if (!h) return [];
  const open = toMin(h.open), close = toMin(h.close);
  let appts = await apptsForDate(ds);
  let blocks = await blocksForDate(ds);
  if (staffId) {
    // Vetëm takimet/bllokimet e këtij stafi (+ bllokimet e gjithë biznesit)
    appts = appts.filter((a) => a.staff_id === staffId);
    blocks = blocks.filter((b) => !b.staff_id || b.staff_id === staffId);
  }
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
// Njësitë e kohëzgjatjes (universale: nga min te vite, ose "—" pa kohë)
const SVC_UNITS = ["min", "hour", "day", "week", "month", "year", "none"];
const UNIT_KEY = { min: "unitMin", hour: "unitHour", day: "unitDay", week: "unitWeek", month: "unitMonth", year: "unitYear", none: "unitNone" };
function unitOptions(sel) {
  return SVC_UNITS.map((u) => `<option value="${u}"${u === sel ? " selected" : ""}>${tr(UNIT_KEY[u])}</option>`).join("");
}
// Kthen kohëzgjatjen në minuta për motorin e kalendarit (vetëm min/orë janë slote reale)
function durToMin(value, unit) {
  const v = Math.max(0, +value || 0);
  if (unit === "min") return Math.max(5, v || 30);
  if (unit === "hour") return Math.max(5, v * 60 || 30);
  return 30; // ditë/javë/muaj/vit/none → s'janë slote; default për motorin
}

function addServiceRow(s) {
  const row = document.createElement("div");
  row.className = "service-row";
  row.innerHTML = `
    <input class="s-name" type="text" placeholder="${tr("svcNamePh")}" value="${s ? s[0] : ""}" maxlength="40">
    <input class="s-dur" type="number" min="0" step="1" value="${s ? s[1] : 30}">
    <select class="s-unit">${unitOptions("min")}</select>
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
  // Mënyra: nëse "porosi/kërkesa" (inquiry) → fsheh orarin (s'ka kalendar)
  const applyMode = () => {
    const inquiry = $("#obMode") && $("#obMode").value === "inquiry";
    const hf = $("#obHours") && $("#obHours").closest(".field");
    if (hf) hf.hidden = inquiry;                                  // pa orar pune për porosi
  };
  if ($("#obMode")) $("#obMode").onchange = applyMode;
  applyMode();
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
    .map((r) => {
      const unit = r.querySelector(".s-unit") ? r.querySelector(".s-unit").value : "min";
      const value = Math.max(0, +r.querySelector(".s-dur").value || 0);
      return {
        name: r.querySelector(".s-name").value.trim(),
        duration_min: durToMin(value, unit),
        duration_value: value,
        duration_unit: unit,
        price: +r.querySelector(".s-price").value || 0,
      };
    }).filter((s) => s.name);
  if (!svcRows.length) { addServiceRow(null); return; }

  btn.disabled = true; btn.textContent = tr("authWait");
  try {
    // Mbrojtje nga dublikatat: nëse biznesi ekziston tashmë, hap panelin
    await loadBusiness();
    if (biz) { await loadAll(); showView("app"); return; }

    const { data: { user } } = await sb.auth.getUser();
    const row = {
      owner_id: user.id, name, type: $("#obType").value,
      address: $("#obAddress").value.trim(), lang,
    };
    if ($("#obMode")) row.mode = $("#obMode").value;   // takime ose porosi/kërkesa
    const { data: b, error } = await sb.from("businesses").insert(row).select().single();
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
  renderStaffPane();
  await Promise.all([renderCalendar(), renderAppointments(), renderBlocks(), renderStats(), renderWaitlist(), renderLeads(), renderActivity(), renderCustomers()]);
}

async function renderCustomers() {
  const list = $("#customerList"); if (!list) return;
  const { data } = await sb.from("appointments")
    .select("client_name, chat_id, channel, appt_date, status, services(price)").eq("business_id", biz.id);
  const map = {};
  for (const a of (data || [])) {
    const key = (a.chat_id || a.client_name || "?") + "|" + (a.channel || "");
    const c = map[key] || { name: a.client_name || "Klient", channel: a.channel || "manual", visits: 0, last: "", spent: 0 };
    if (a.client_name) c.name = a.client_name;
    if (a.status !== "cancelled") {
      c.visits++; c.spent += a.services ? Number(a.services.price) || 0 : 0;
      if (a.appt_date > c.last) c.last = a.appt_date;
    }
    map[key] = c;
  }
  let rows = Object.values(map).filter((c) => c.visits > 0).sort((a, b) => (b.last || "").localeCompare(a.last || ""));
  const q = ($("#custSearch") && $("#custSearch").value.trim().toLowerCase()) || "";
  if (q) rows = rows.filter((c) => (c.name || "").toLowerCase().includes(q));
  if (!rows.length) { list.innerHTML = `<div class="empty">${tr("emptyCustomers")}</div>`; return; }
  list.innerHTML = "";
  for (const c of rows) {
    const item = document.createElement("div");
    item.className = "block-item";
    item.innerHTML = `<span class="grow">👤 <strong>${esc(c.name)}</strong> <small style="color:var(--ink-faint)">· ${esc(c.channel)}</small></span>
      <span style="font-size:12.5px;font-weight:700;color:var(--ink-soft);white-space:nowrap">${c.visits} ${tr("visitsW")} · ${c.spent}€${c.last ? " · " + humanDate(c.last) : ""}</span>`;
    list.appendChild(item);
  }
}

async function renderActivity() {
  const list = $("#activityList"); if (!list) return;
  const { data } = await sb.from("notifications").select("*").eq("business_id", biz.id)
    .order("created_at", { ascending: false }).limit(60);
  const rows = data || [];
  if (!rows.length) { list.innerHTML = `<div class="empty">${tr("emptyActivity")}</div>`; return; }
  list.innerHTML = "";
  for (const n of rows) {
    const d = new Date(n.created_at);
    const item = document.createElement("div");
    item.className = "block-item";
    item.innerHTML = `<span class="grow">${esc(n.text)}<small style="color:var(--ink-faint)"> · ${d.getDate()} ${T[lang].months[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}</small></span>`;
    list.appendChild(item);
  }
}

async function renderLeads() {
  const list = $("#leadsList"); if (!list) return;
  const { data } = await sb.from("leads").select("*").eq("business_id", biz.id)
    .order("created_at", { ascending: false }).limit(50);
  const rows = data || [];
  if (!rows.length) { list.innerHTML = `<div class="empty">${tr("emptyLeads")}</div>`; return; }
  list.innerHTML = "";
  for (const l of rows) {
    const d = new Date(l.created_at);
    const st = l.status === "contacted" ? tr("leadContacted") : tr("leadNew");
    const item = document.createElement("div");
    item.className = "block-item";
    item.innerHTML = `<span class="grow">🛒 <strong>${esc(l.client_name || "Klient")}</strong> — ${esc(l.summary)}
      <small style="color:var(--ink-faint)"> · ${d.getDate()} ${T[lang].months[d.getMonth()]}</small>
      <span class="tag ${l.status === "contacted" ? "confirmed" : "pending"}">${st}</span></span>`;
    if (l.status !== "contacted") {
      const b = document.createElement("button");
      b.className = "btn small ghost"; b.textContent = tr("markContacted");
      b.onclick = async () => { await sb.from("leads").update({ status: "contacted" }).eq("id", l.id); await renderLeads(); };
      item.appendChild(b);
    }
    list.appendChild(item);
  }
}

function staffName(id) { const s = staff.find((x) => x.id === id); return s ? s.name : null; }

function renderStaffPane() {
  const sl = $("#staffLoc");
  if (sl) sl.innerHTML = `<option value="">${tr("noLoc")}</option>` + locations.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join("");

  const ll = $("#locList");
  if (ll) {
    ll.innerHTML = "";
    if (!locations.length) ll.innerHTML = `<div class="empty">${tr("emptyLoc")}</div>`;
    for (const l of locations) {
      const item = document.createElement("div"); item.className = "block-item";
      item.innerHTML = `<span class="grow">📍 <strong>${esc(l.name)}</strong>${l.address ? " — " + esc(l.address) : ""}</span>`;
      const del = document.createElement("button"); del.className = "btn small ghost danger"; del.textContent = tr("remove");
      del.onclick = async () => { await sb.from("locations").delete().eq("id", l.id); await loadLocations(); setupStaffUI(); renderStaffPane(); };
      item.appendChild(del); ll.appendChild(item);
    }
  }

  const stl = $("#staffList");
  if (stl) {
    stl.innerHTML = "";
    if (!staff.length) stl.innerHTML = `<div class="empty">${tr("emptyStaff")}</div>`;
    for (const s of staff) {
      const loc = locations.find((l) => l.id === s.location_id);
      const item = document.createElement("div"); item.className = "block-item";
      item.innerHTML = `<span class="grow">👤 <strong>${esc(s.name)}</strong>${s.role && s.role !== "staff" ? " • " + esc(s.role) : ""}${loc ? " • 📍 " + esc(loc.name) : ""}</span>`;
      const del = document.createElement("button"); del.className = "btn small ghost danger"; del.textContent = tr("remove");
      del.onclick = async () => { await sb.from("staff").update({ active: false }).eq("id", s.id); await loadStaff(); setupStaffUI(); await renderAll(); };
      item.appendChild(del); stl.appendChild(item);
    }
  }
}

const PERIOD_LBL = { morning: "periodMorning", afternoon: "periodAfternoon", evening: "periodEvening" };
async function renderWaitlist() {
  const list = $("#waitList"); if (!list) return;
  const today = fmtDate(new Date());
  const { data } = await sb.from("waitlist").select("*, services(name)")
    .eq("business_id", biz.id).gte("desired_date", today)
    .in("status", ["waiting", "notified"]).order("desired_date").order("created_at");
  const rows = data || [];
  if (!rows.length) { list.innerHTML = `<div class="empty">${tr("emptyWait")}</div>`; return; }
  list.innerHTML = "";
  for (const w of rows) {
    const svc = w.services ? w.services.name : "—";
    const per = w.period && PERIOD_LBL[w.period] ? tr(PERIOD_LBL[w.period]) : tr("periodAny");
    const st = w.status === "notified" ? tr("waitNotified") : tr("waitWaiting");
    const item = document.createElement("div");
    item.className = "block-item";
    item.innerHTML = `<span class="grow">⏳ <strong>${esc(w.client_name || "Klient")}</strong> — ${esc(svc)} • ${humanDate(w.desired_date)} • ${per}
      <span class="tag ${w.status === "notified" ? "confirmed" : "pending"}">${st}</span></span>`;
    const del = document.createElement("button");
    del.className = "btn small ghost danger"; del.textContent = tr("remove");
    del.onclick = async () => { await sb.from("waitlist").delete().eq("id", w.id); await renderWaitlist(); };
    item.appendChild(del);
    list.appendChild(item);
  }
}

async function renderCalendar() {
  const d = parseDate(calDate);
  $("#calLabel").textContent = `${T[lang].dayNames[d.getDay()]}, ${d.getDate()} ${T[lang].months[d.getMonth()]} ${d.getFullYear()}`;
  const tl = $("#timeline"); tl.innerHTML = "";
  const h = hours[d.getDay()];
  if (!h) { tl.innerHTML = `<div class="empty">${tr("dayOff")}</div>`; return; }
  const open = toMin(h.open), close = toMin(h.close);
  let appts = await apptsForDate(calDate);
  let blocks = await blocksForDate(calDate);
  if (calStaff) {
    appts = appts.filter((a) => a.staff_id === calStaff);
    blocks = blocks.filter((b) => !b.staff_id || b.staff_id === calStaff);
  }
  for (let t = open; t < close; t += SLOT_STEP) {
    const row = document.createElement("div");
    const appt = appts.find((a) => {
      const s = svcById(a.service_id); const st = toMin(hm(a.appt_time));
      return t >= st && t < st + (s ? s.duration_min : SLOT_STEP);
    });
    const block = blocks.find((b) => t >= toMin(hm(b.from_time)) && t < toMin(hm(b.to_time)));
    if (appt) {
      const s = svcById(appt.service_id); const isStart = toMin(hm(appt.appt_time)) === t;
      const stf = staffName(appt.staff_id);
      row.className = "slot busy";
      row.innerHTML = `<span class="time">${toHM(t)}</span>
        <span class="label">${isStart ? `<strong>${esc(appt.client_name)}</strong> — ${s ? esc(s.name) : ""}${stf && !calStaff ? ` · 👤 ${esc(stf)}` : ""}` : tr("cont")}</span>
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
        <div class="what">${s ? esc(s.name) + " • " + s.price + "€" : ""} • ${a.source === "ai" ? tr("bookedAi") : tr("manual")}${staffName(a.staff_id) ? " • 👤 " + esc(staffName(a.staff_id)) : ""}
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
  // Marrim çdo takim me emrin/çmimin e shërbimit (edhe nëse shërbimi është çaktivizuar)
  const { data } = await sb.from("appointments")
    .select("appt_date, appt_time, status, source, client_name, services(name, price)")
    .eq("business_id", biz.id);
  const appts = data || [];
  const grid = $("#statsGrid");

  if (!appts.length) {
    grid.innerHTML = `<div class="bi-empty">${tr("statNoData")}</div>`;
    return;
  }

  const active = appts.filter((a) => a.status !== "cancelled");
  const price = (a) => (a.services ? Number(a.services.price) || 0 : 0);
  const svcName = (a) => (a.services ? a.services.name : "—");

  // ----- Të ardhura këtë muaj vs muaji i kaluar -----
  const now = new Date();
  const ym = (d) => d.getFullYear() * 12 + d.getMonth();
  const thisYM = ym(now), lastYM = thisYM - 1;
  let revThis = 0, revLast = 0;
  for (const a of active) {
    const m = ym(parseDate(a.appt_date));
    if (m === thisYM) revThis += price(a);
    else if (m === lastYM) revLast += price(a);
  }
  let trendHtml = "";
  if (revLast > 0) {
    const pct = Math.round(((revThis - revLast) / revLast) * 100);
    const word = pct > 0 ? tr("revTrendUp") : pct < 0 ? tr("revTrendDown") : tr("revTrendFlat");
    const cls = pct > 0 ? "up" : pct < 0 ? "down" : "";
    const arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "■";
    trendHtml = `<span class="trend ${cls}">${arrow} ${Math.abs(pct)}% ${word}</span>`;
  }

  // ----- Norma e anulimeve -----
  const cancelled = appts.length - active.length;
  const cancelRate = appts.length ? Math.round((cancelled / appts.length) * 100) : 0;

  // ----- Pjesa e AI -----
  const aiCount = active.filter((a) => a.source === "ai").length;
  const aiShare = active.length ? Math.round((aiCount / active.length) * 100) : 0;

  // ----- Dita më e ngarkuar + ora e pikut -----
  const byDow = Array(7).fill(0), byHour = {};
  for (const a of active) {
    byDow[parseDate(a.appt_date).getDay()]++;
    const h = parseInt(hm(a.appt_time).slice(0, 2), 10);
    byHour[h] = (byHour[h] || 0) + 1;
  }
  const peakDowIdx = byDow.indexOf(Math.max(...byDow));
  const peakDay = Math.max(...byDow) > 0 ? T[lang].dayNames[peakDowIdx] : "—";
  const peakHourNum = Object.keys(byHour).sort((a, b) => byHour[b] - byHour[a])[0];
  const peakHour = peakHourNum !== undefined ? `${pad(peakHourNum)}:00` : "—";

  // ----- Shërbimet TOP -----
  const svcMap = {};
  for (const a of active) { const n = svcName(a); svcMap[n] = (svcMap[n] || 0) + 1; }
  const topSvc = Object.entries(svcMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSvc = topSvc.length ? topSvc[0][1] : 1;

  // ----- Klientët VIP -----
  const cliMap = {};
  for (const a of active) { const n = a.client_name || "—"; cliMap[n] = (cliMap[n] || 0) + 1; }
  const vip = Object.entries(cliMap).filter(([, c]) => c >= 1).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ----- Ngarkesa 7 ditë -----
  const next7 = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const ds = fmtDate(d);
    next7.push([d, active.filter((a) => a.appt_date === ds).length]);
  }
  const maxLoad = Math.max(1, ...next7.map((x) => x[1]));

  const cancelCls = cancelRate >= 25 ? "warn" : "";

  grid.innerHTML = `
    <div class="stats-grid-top">
      <div class="stat-card highlight">
        <div class="num">${revThis}€</div>
        <div class="lbl">${tr("statThisMonth")}</div>
        ${trendHtml || `<span class="trend muted">${tr("statVsLast")}: ${revLast}€</span>`}
      </div>
      <div class="stat-card">
        <div class="num">${active.length}</div>
        <div class="lbl">${tr("statActive")}</div>
      </div>
      <div class="stat-card ai">
        <div class="num">${aiShare}%</div>
        <div class="lbl">${tr("statAiShare")}</div>
        <span class="trend muted">${aiCount} ${tr("aiSaved")}</span>
      </div>
      <div class="stat-card ${cancelCls}">
        <div class="num">${cancelRate}%</div>
        <div class="lbl">${tr("statCancelRate")}</div>
      </div>
    </div>

    <h3 class="bi-h">${tr("secInsights")}</h3>
    <div class="bi-insights">
      <div class="bi-chip"><span class="bi-ico">📅</span><div><div class="bi-k">${tr("statPeakDay")}</div><div class="bi-v">${peakDay}</div></div></div>
      <div class="bi-chip"><span class="bi-ico">⏰</span><div><div class="bi-k">${tr("statPeakHour")}</div><div class="bi-v">${peakHour}</div></div></div>
    </div>

    <div class="bi-cols">
      <div class="bi-box">
        <h3 class="bi-h">${tr("secTopServices")}</h3>
        ${topSvc.map(([n, c]) => `
          <div class="bi-bar-row">
            <span class="bi-bar-lbl">${esc(n)}</span>
            <span class="bi-bar"><span class="bi-bar-fill" style="width:${Math.round((c / maxSvc) * 100)}%"></span></span>
            <span class="bi-bar-num">${c}</span>
          </div>`).join("")}
      </div>
      <div class="bi-box">
        <h3 class="bi-h">${tr("secVip")}</h3>
        ${vip.map(([n, c], i) => `
          <div class="bi-vip-row">
            <span class="bi-rank">${["🥇","🥈","🥉","4","5"][i]}</span>
            <span class="bi-vip-name">${esc(n)}</span>
            <span class="bi-vip-c">${c} ${tr("visitsW")}</span>
          </div>`).join("")}
      </div>
    </div>

    <div class="bi-box">
      <h3 class="bi-h">${tr("secLoad")}</h3>
      <div class="bi-load">
        ${next7.map(([d, c]) => `
          <div class="bi-load-col">
            <span class="bi-load-num">${c || ""}</span>
            <span class="bi-load-bar" style="height:${Math.max(6, Math.round((c / maxLoad) * 90))}px"></span>
            <span class="bi-load-day">${T[lang].dayNames[d.getDay()].slice(0, lang === "sq" ? 3 : 3)}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

/* ---------------- Takim manual ---------------- */
async function openManual() {
  $("#manService").innerHTML = services.map((s) => `<option value="${s.id}">${esc(s.name)} (${s.duration_min} min)</option>`).join("");
  if (staff.length) {
    $("#manStaff").innerHTML = staff.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    $("#manStaff").value = calStaff || staff[0].id;
  }
  $("#manDate").value = calDate;
  await refreshManTimes();
  $("#manModal").hidden = false;
  setTimeout(() => $("#manClient").focus(), 60);
}
function manStaffId() { return staff.length ? ($("#manStaff").value || null) : null; }
async function refreshManTimes() {
  const s = svcById($("#manService").value);
  const slots = s && $("#manDate").value ? await freeSlots($("#manDate").value, s.duration_min, true, manStaffId()) : [];
  $("#manTime").innerHTML = slots.length ? slots.map((x) => `<option>${x}</option>`).join("")
    : `<option value="">${tr("noSlots")}</option>`;
}
async function saveManual() {
  const client = $("#manClient").value.trim();
  const time = $("#manTime").value;
  if (!client) { $("#manClient").focus(); return; }
  if (!time) { toast(tr("pickTime")); return; }
  const sid = manStaffId();
  const st = sid ? staff.find((x) => x.id === sid) : null;
  const row = {
    business_id: biz.id, service_id: $("#manService").value,
    client_name: client, appt_date: $("#manDate").value, appt_time: time,
    status: "pending", source: "manual",
  };
  // Vendos staf vetëm kur ka staf (enterprise.sql i ekzekutuar)
  if (sid) { row.staff_id = sid; row.location_id = st ? st.location_id : null; }
  await sb.from("appointments").insert(row);
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
  // Toggle i temës (errët/çelët) — ruhet, respekton sistemin si default
  const themeBtn = $("#themeToggle");
  if (themeBtn) {
    const curTheme = () => document.documentElement.getAttribute("data-theme") || "light";
    const themeLbl = (t) => (t === "dark" ? "☀️" : "🌙");
    themeBtn.textContent = themeLbl(curTheme());
    themeBtn.onclick = () => {
      const n = curTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", n);
      try { localStorage.setItem("ob-theme", n); } catch (e) {}
      themeBtn.textContent = themeLbl(n);
    };
  }
  $("#authForm").addEventListener("submit", handleAuth);
  $("#authToggle").onclick = () => {
    authMode = authMode === "signup" ? "login" : "signup";
    $("#authError").textContent = "";
    renderAuthMode();
  };
  $("#obAddService").onclick = () => addServiceRow(null);
  $("#obFinish").onclick = finishOnboard;
  $("#btnLogout").onclick = logout;
  const srBtn = $("#saveReviewUrl");
  if (srBtn) srBtn.onclick = async () => {
    const url = $("#reviewUrl").value.trim();
    try {
      await sb.from("businesses").update({ review_url: url || null }).eq("id", biz.id);
      biz.review_url = url || null;
      toast(tr("toastSaved"));
    } catch (ex) { alert(ex.message || String(ex)); }
  };
  const anBtn = $("#saveAiNotes");
  if (anBtn) anBtn.onclick = async () => {
    const v = $("#aiNotes").value.trim();
    try {
      await sb.from("businesses").update({ ai_notes: v || null }).eq("id", biz.id);
      biz.ai_notes = v || null;
      toast(tr("toastSaved"));
    } catch (ex) { alert(ex.message || String(ex)); }
  };
  const modeBtn = $("#saveMode");
  if (modeBtn) modeBtn.onclick = async () => {
    const m = $("#bizMode").value;
    try {
      await sb.from("businesses").update({ mode: m }).eq("id", biz.id);
      biz.mode = m;
      applyModeUI();
      toast(tr("toastSaved"));
    } catch (ex) { alert(ex.message || String(ex)); }
  };
  const biBtn = $("#saveBizInfo");
  if (biBtn) biBtn.onclick = async () => {
    const name = $("#setName").value.trim() || biz.name;
    const address = $("#setAddress").value.trim();
    try {
      await sb.from("businesses").update({ name, address }).eq("id", biz.id);
      biz.name = name; biz.address = address;
      $("#bizName").textContent = tr("panelPrefix") + biz.name;
      toast(tr("toastSaved"));
    } catch (ex) { alert(ex.message || String(ex)); }
  };
  if ($("#custSearch")) $("#custSearch").oninput = renderCustomers;
  const tgBtn = $("#saveTgToken");
  if (tgBtn) tgBtn.onclick = async () => {
    const t = $("#tgToken").value.trim();
    try {
      await sb.from("businesses").update({ telegram_token: t || null }).eq("id", biz.id);
      biz.telegram_token = t || null;
      updateTgWebhookLink();
      toast(tr("toastSaved"));
    } catch (ex) { alert(ex.message || String(ex)); }
  };
  if ($("#tgToken")) $("#tgToken").oninput = updateTgWebhookLink;
  if ($("#setAddService")) $("#setAddService").onclick = () => setServiceRow(null);
  if ($("#saveServices")) $("#saveServices").onclick = saveServicesEdit;
  if ($("#saveHours")) $("#saveHours").onclick = saveHoursEdit;
  $("#calPrev").onclick = () => { const d = parseDate(calDate); d.setDate(d.getDate() - 1); calDate = fmtDate(d); renderCalendar(); };
  $("#calNext").onclick = () => { const d = parseDate(calDate); d.setDate(d.getDate() + 1); calDate = fmtDate(d); renderCalendar(); };
  $("#calToday").onclick = () => { calDate = fmtDate(new Date()); renderCalendar(); };
  $("#btnAddAppt").onclick = openManual;
  $("#manService").onchange = refreshManTimes;
  $("#manDate").onchange = refreshManTimes;
  if ($("#manStaff")) $("#manStaff").onchange = refreshManTimes;
  if ($("#calStaff")) $("#calStaff").onchange = (e) => { calStaff = e.target.value || null; renderCalendar(); };
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
  if ($("#locForm")) $("#locForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#locName").value.trim(); if (!name) return;
    const { error } = await sb.from("locations").insert({
      business_id: biz.id, name, address: $("#locAddr").value.trim() || null, sort_order: locations.length,
    });
    if (error) { alert(error.message); return; }
    e.target.reset(); await loadLocations(); setupStaffUI(); renderStaffPane(); toast(tr("toastSaved"));
  });
  if ($("#staffForm")) $("#staffForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#staffName").value.trim(); if (!name) return;
    const { error } = await sb.from("staff").insert({
      business_id: biz.id, name, role: $("#staffRole").value.trim() || "staff",
      location_id: $("#staffLoc").value || null, sort_order: staff.length,
    });
    if (error) { alert(error.message); return; }
    e.target.reset(); await loadStaff(); setupStaffUI(); await renderAll(); toast(tr("toastSaved"));
  });
}

/* ---------------- Nisja ---------------- */
async function init() {
  applyLang();
  wire();
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session) { await afterLogin(); }
    else { showView("auth"); }
  } catch (e) {
    // Çfarëdo gabimi gjatë nisjes → trego të paktën hyrjen, kurrë faqe bosh
    console.error("init error:", e);
    showView("auth");
  }
}
init();
