/* =====================================================================
   OptimaBook — Demo i Fazës 1 (dygjuhësh: Shqip + English)
   Tre shtylla: (1) motori i pagabueshëm i rezervimeve,
   (2) biseda AI që rezervon VETËM orare reale nga kalendari,
   (3) paneli i pronarit.
   Në produksion, "truri" i bisedës zëvendësohet me një LLM API +
   tool-use mbi të njëjtin motor rezervimesh — logjika nuk ndryshon,
   dhe LLM flet çdo gjuhë vetvetiu.
   ===================================================================== */

"use strict";

/* ---------------- Përkthimet / Translations ---------------- */

const I18N = {
  sq: {
    locale: "sq-AL",
    dayNames: ["E diel", "E hënë", "E martë", "E mërkurë", "E enjte", "E premte", "E shtunë"],
    months: ["janar", "shkurt", "mars", "prill", "maj", "qershor",
             "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"],
    presets: {
      barber: { label: "💈 Berber", nameEx: "Toni Barber", services: [
        { name: "Qethje", dur: 30, price: 5 },
        { name: "Qethje + Mjekër", dur: 45, price: 8 },
      ]},
      salon: { label: "💅 Sallon bukurie", nameEx: "Sallon Anna", services: [
        { name: "Prerje & Styling", dur: 60, price: 20 },
        { name: "Ngjyrosje flokësh", dur: 90, price: 35 },
        { name: "Manikyr", dur: 45, price: 12 },
      ]},
      dentist: { label: "🦷 Dentist", nameEx: "Klinika Dentare Smile", services: [
        { name: "Kontroll", dur: 30, price: 20 },
        { name: "Pastrim gurëzash", dur: 45, price: 40 },
        { name: "Mbushje", dur: 60, price: 50 },
      ]},
      physio: { label: "💆 Fizioterapi & Masazh", nameEx: "FizioCare", services: [
        { name: "Seancë fizioterapie", dur: 45, price: 25 },
        { name: "Masazh terapeutik", dur: 60, price: 30 },
      ]},
      gym: { label: "🏋️ Palestra / Trajner", nameEx: "FitZone", services: [
        { name: "Seancë personale", dur: 60, price: 15 },
        { name: "Vlerësim fillestar", dur: 45, price: 10 },
      ]},
      auto: { label: "🚗 Servis makinash", nameEx: "Auto Servis Berti", services: [
        { name: "Ndërrim vaji", dur: 30, price: 25 },
        { name: "Kontroll i përgjithshëm", dur: 60, price: 30 },
        { name: "Ndërrim gomash", dur: 45, price: 20 },
      ]},
      clinic: { label: "🩺 Klinikë / Mjek", nameEx: "Klinika Vita", services: [
        { name: "Konsultë", dur: 30, price: 30 },
        { name: "Ekografi", dur: 30, price: 40 },
      ]},
      restaurant: { label: "🍽 Restorant", nameEx: "Restorant Alba", services: [
        { name: "Tavolinë për 2", dur: 90, price: 0 },
        { name: "Tavolinë për 4", dur: 90, price: 0 },
        { name: "Tavolinë për 6+", dur: 120, price: 0 },
      ]},
      vet: { label: "🐾 Veteriner", nameEx: "Klinika Veterinare Pet", services: [
        { name: "Vizitë kontrolli", dur: 30, price: 15 },
        { name: "Vaksinim", dur: 20, price: 20 },
      ]},
      lawyer: { label: "⚖️ Avokat / Noter", nameEx: "Studio Ligjore Lex", services: [
        { name: "Konsultë ligjore", dur: 60, price: 50 },
        { name: "Përpilim dokumenti", dur: 30, price: 30 },
      ]},
      tattoo: { label: "🎨 Tatuazh / Piercing", nameEx: "Ink Studio", services: [
        { name: "Konsultë dizajni", dur: 30, price: 0 },
        { name: "Seancë tatuazhi", dur: 120, price: 80 },
      ]},
      photo: { label: "📸 Fotograf", nameEx: "Foto Studio Art", services: [
        { name: "Seancë portreti", dur: 60, price: 40 },
        { name: "Seancë eventi", dur: 120, price: 100 },
      ]},
      tutor: { label: "📚 Mësues / Kurse", nameEx: "Qendra Edu", services: [
        { name: "Orë individuale", dur: 60, price: 10 },
        { name: "Orë në grup", dur: 90, price: 5 },
      ]},
      other: { label: "✨ Tjetër", nameEx: "Biznesi Im", services: [
        { name: "Shërbim standard", dur: 30, price: 10 },
      ]},
    },
    ui: {
      brandTag: "Recepsionisti AI që nuk fle kurrë",
      settings: "⚙ Cilësimet",
      reset: "↺ Rifillo demon",
      resetConfirm: "Të fshihet gjithçka dhe demo të rifillojë nga zero?",
      hint: "<strong>Kjo është ana e klientit</strong> — shkruaj si klient i biznesit, p.sh.:",
      chips: [
        "Pershendetje, a ke neser pasdite nje orar per qethje?",
        "Sa kushtojne sherbimet?",
        "Dua te anuloj takimin",
      ],
      inputPlaceholder: "Shkruaj një mesazh…",
      writingAs: "Po shkruan si:",
      panelPrefix: "Paneli — ",
      panelSub: "Gjithçka që bën AI, e sheh dhe e kontrollon këtu — pa lëvizur gishtin.",
      tabCalendar: "📅 Kalendari", tabAppts: "📋 Takimet", tabBlocks: "⛔ Bllokime",
      tabNotifs: "🔔 Njoftimet", tabStats: "📊 Statistika",
      today: "Sot", todayWord: "sot", tomorrowWord: "nesër",
      dayOff: "Ditë pushimi — AI nuk ofron asnjë orar këtë ditë. 😌",
      slotFree: "I lirë", slotCont: "↳ vazhdim", slotBlocked: "⛔ Bllokuar",
      tagConfirmed: "konfirmuar", tagPending: "në pritje",
      addManual: "+ Shto takim manual",
      emptyAppts: "Asnjë takim ende. Shkruaji AI-së nga telefoni majtas — rezervimi shfaqet këtu në çast. ⚡",
      bookedByAi: "🤖 rezervoi AI", manualWord: "✍ manual",
      confirmedWord: "✓ konfirmuar", cancelledWord: "anuluar",
      sendReminder: "🔔 Dërgo kujtesë", cancelBtn: "Anulo",
      blocksDesc: "Blloko orare kur nuk punon (dasmë, pushim, vizitë) — AI nuk ia ofron askujt.",
      blockReasonPh: "Arsyeja (opsionale)", blockBtn: "Blloko",
      emptyBlocks: "Asnjë bllokim. Kur s'punon, bllokoje orarin këtu — AI nuk ia ofron askujt.",
      removeBtn: "Hiq",
      notifsDesc: "Kur AI nuk është i sigurt, nuk hamendëson — ta kalon ty. Këtu i sheh.",
      emptyNotifs: "Asnjë njoftim ende. Kur AI rezervon, anulon, ose s'është i sigurt — e sheh këtu.",
      statActive: "Takime aktive", statAi: "Rezervoi AI (24/7, pa pronarin)",
      statRevenue: "Të ardhura të rezervuara", statReminders: "Kujtesa të dërguara",
      statAvoided: "Mungesa të shmangura", statCancellations: "Anulime (orari u lirua vetë)",
      statsNote: "Këto shifra janë arsyeja pse biznesi e rinovon abonimin çdo muaj pa diskutim.",
      setupTitle: "Mirë se erdhe! 👋",
      setupSub: "Biznesi yt gati për klientë në <strong>nën 5 minuta</strong> — kjo është premtimi ynë.",
      setupType: "Lloji i biznesit",
      setupName: "Emri i biznesit",
      setupAddr: "Adresa", setupAddrPh: "p.sh. Rruga e Durrësit 12, Tiranë",
      setupServices: "Shërbimet (emri, minutat, çmimi €)", addService: "+ Shto shërbim",
      svcNamePh: "Emri i shërbimit",
      setupHours: "Orari i punës", closedToggle: "pushim",
      finishSetup: "Përfundo — jam gati për klientë ✓",
      manTitle: "Takim manual", manSub: "Për klientin që të vjen në derë ose në telefon.",
      manClient: "Emri i klientit", manService: "Shërbimi", manDate: "Data", manTime: "Ora",
      manCancel: "Anulo", manSave: "Ruaj takimin", noFreeSlots: "— asnjë orar i lirë —",
      sysWelcome: "Biseda zhvillohet në WhatsApp-in e biznesit — klienti s'instalon asgjë",
      sysReminder: "Kujtesë automatike — dërguar nga sistemi, pa lëvizur gishtin pronari",
      typing: "po shkruan…",
      viewClient: "💬 Klienti", viewPanel: "📊 Paneli",
      toastBooked: "✅ Rezervimi u shtua në kalendar",
      toastCancelled: "🗑 Takimi u anulua — orari u lirua",
      toastReminder: "🔔 Kujtesa u dërgua te klienti",
      toastBlocked: "⛔ Orari u bllokua",
    },
    bot: {
      welcome: "Përshëndetje! 👋 Mirë se erdhe te **{biz}**. Jam asistenti i rezervimeve — më shkruaj kur do të vish dhe ta gjej orarin për 10 sekonda, çdo orë të ditës a natës. 🌙",
      greeting: "Përshëndetje {name}! 👋 Këtu {biz} — si mund të të ndihmoj? Mund të rezervosh orar direkt këtu, vetëm më thuaj ditën.",
      offer: "Për {date} ({svc}) kam të lira: **{slots}**. Cila të përshtatet?",
      offerOtherPeriod: "Për {date} në atë fashë jam i zënë, por kam të lira: **{slots}**. A të përshtatet ndonjëra?",
      dayFull: "Më vjen keq, {date} jam plot ose pushim. 😕 Po {next}? Kam: **{slots}**",
      noneSoon: "Më vjen keq, ato ditë jam plot. Më shkruaj një ditë tjetër dhe ta gjej menjëherë një orar.",
      booked: "U rezervua! ✅\n**{date}, ora {time}**\n{svc} ({dur} min, {price}€)\n📍 {biz}{address}\n\nTë pres! Nëse të del ndonjë gjë, më shkruaj këtu për ta ndryshuar.",
      justTaken: "Oh, ai orar sapo u zu nga dikush tjetër! ⚡ Të lira kanë mbetur: **{slots}**. Cila të përshtatet?",
      takenNoAlt: "Ai orar sapo u zu dhe s'ka të tjera atë ditë — më thuaj një ditë tjetër të ta gjej.",
      busyAt: "Në {time} jam i zënë {date}. 😕 Më të afërtat e lira: **{slots}** — a të përshtatet ndonjëra?",
      busyPick: "Në {time} jam i zënë atë ditë. Të lirat janë: **{slots}** — të përshtatet ndonjëra?",
      askDay: "Në rregull — {svc} ({dur} min, {price}€). Për cilën ditë? (sot, nesër, ose dita e javës)",
      askService: "Patjetër! Cilin shërbim dëshiron?\n{services}",
      priceList: "Ja shërbimet tona:\n{services}\n\nA të rezervoj një orar? Më thuaj ditën që të përshtatet. 📅",
      hoursReply: "📍 {address}\n\nOrari ynë:\n{hours}\n\nDo një rezervim? Më thuaj ditën!",
      cancelled: "Takimi yt i {date} në {time} u anulua dhe orari u lirua. Kur të duash një tjetër, më shkruaj — të gjej orar për 10 sekonda. 😉",
      noAppt: "Nuk gjej ndonjë takim aktiv në emrin tënd. Mos ke rezervuar me emër tjetër?",
      reminder: "Përshëndetje {name}! ⏰ Të kujtoj takimin tënd:\n**{date}, ora {time}** — {svc}\nte {biz}.\n\nA do të vish?",
      reminderYes: "E shkëlqyer, të pres! 🙌",
      reminderNo: "S'ka problem, e anulova dhe orari u lirua. A do ta zëvendësosh? Të lira po atë ditë: **{slots}** — ose më thuaj një ditë tjetër.",
      reminderNoNoAlt: "S'ka problem, e anulova. Më shkruaj kur të duash për një orar të ri!",
      thanks: "Me kënaqësi! 😊 Të presim.",
      unknown: "Pyetje e mirë — për këtë po e konfirmoj me pronarin dhe të kthej përgjigje sa më shpejt! Ndërkohë, nëse do një rezervim, ta gjej menjëherë një orar. 🙂",
      quickYes: "Po, e konfirmoj ✅", quickNo: "S'vij dot ❌",
      notifBooked: "✅ Rezervim i ri nga AI: {name} — {svc}, {date} në {time}.",
      notifCancel: "❌ {name} anuloi takimin e {date} në {time}. Orari u lirua automatikisht.",
      notifUnknown: "❓ {name} pyeti diçka që s'e mbuloj dot: “{text}” — përgjigju nga paneli.",
    },
  },

  en: {
    locale: "en-GB",
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    months: ["January", "February", "March", "April", "May", "June",
             "July", "August", "September", "October", "November", "December"],
    presets: {
      barber: { label: "💈 Barbershop", nameEx: "Tony's Barbershop", services: [
        { name: "Haircut", dur: 30, price: 15 },
        { name: "Haircut + Beard", dur: 45, price: 22 },
      ]},
      salon: { label: "💅 Beauty salon", nameEx: "Anna's Salon", services: [
        { name: "Cut & Styling", dur: 60, price: 40 },
        { name: "Hair coloring", dur: 90, price: 70 },
        { name: "Manicure", dur: 45, price: 25 },
      ]},
      dentist: { label: "🦷 Dentist", nameEx: "Smile Dental Clinic", services: [
        { name: "Check-up", dur: 30, price: 50 },
        { name: "Cleaning", dur: 45, price: 80 },
        { name: "Filling", dur: 60, price: 120 },
      ]},
      physio: { label: "💆 Physio & Massage", nameEx: "PhysioCare", services: [
        { name: "Physiotherapy session", dur: 45, price: 50 },
        { name: "Therapeutic massage", dur: 60, price: 60 },
      ]},
      gym: { label: "🏋️ Gym / Personal trainer", nameEx: "FitZone", services: [
        { name: "Personal training session", dur: 60, price: 35 },
        { name: "Initial assessment", dur: 45, price: 25 },
      ]},
      auto: { label: "🚗 Car service", nameEx: "Bert's Auto Service", services: [
        { name: "Oil change", dur: 30, price: 45 },
        { name: "General inspection", dur: 60, price: 60 },
        { name: "Tire change", dur: 45, price: 40 },
      ]},
      clinic: { label: "🩺 Clinic / Doctor", nameEx: "Vita Clinic", services: [
        { name: "Consultation", dur: 30, price: 60 },
        { name: "Ultrasound", dur: 30, price: 80 },
      ]},
      restaurant: { label: "🍽 Restaurant", nameEx: "Alba Restaurant", services: [
        { name: "Table for 2", dur: 90, price: 0 },
        { name: "Table for 4", dur: 90, price: 0 },
        { name: "Table for 6+", dur: 120, price: 0 },
      ]},
      vet: { label: "🐾 Veterinarian", nameEx: "Pet Care Clinic", services: [
        { name: "Check-up visit", dur: 30, price: 40 },
        { name: "Vaccination", dur: 20, price: 35 },
      ]},
      lawyer: { label: "⚖️ Lawyer / Notary", nameEx: "Lex Law Office", services: [
        { name: "Legal consultation", dur: 60, price: 120 },
        { name: "Document drafting", dur: 30, price: 80 },
      ]},
      tattoo: { label: "🎨 Tattoo / Piercing", nameEx: "Ink Studio", services: [
        { name: "Design consultation", dur: 30, price: 0 },
        { name: "Tattoo session", dur: 120, price: 150 },
      ]},
      photo: { label: "📸 Photographer", nameEx: "Art Photo Studio", services: [
        { name: "Portrait session", dur: 60, price: 90 },
        { name: "Event session", dur: 120, price: 200 },
      ]},
      tutor: { label: "📚 Tutor / Courses", nameEx: "Edu Center", services: [
        { name: "Private lesson", dur: 60, price: 30 },
        { name: "Group lesson", dur: 90, price: 15 },
      ]},
      other: { label: "✨ Other", nameEx: "My Business", services: [
        { name: "Standard service", dur: 30, price: 20 },
      ]},
    },
    ui: {
      brandTag: "The AI receptionist that never sleeps",
      settings: "⚙ Settings",
      reset: "↺ Restart demo",
      resetConfirm: "Erase everything and restart the demo from scratch?",
      hint: "<strong>This is the customer side</strong> — write as a customer of the business, e.g.:",
      chips: [
        "Hi, do you have a slot tomorrow afternoon for a haircut?",
        "How much are your services?",
        "I want to cancel my appointment",
      ],
      inputPlaceholder: "Type a message…",
      writingAs: "Writing as:",
      panelPrefix: "Panel — ",
      panelSub: "Everything the AI does, you see and control here — without lifting a finger.",
      tabCalendar: "📅 Calendar", tabAppts: "📋 Appointments", tabBlocks: "⛔ Time blocks",
      tabNotifs: "🔔 Notifications", tabStats: "📊 Statistics",
      today: "Today", todayWord: "today", tomorrowWord: "tomorrow",
      dayOff: "Day off — the AI offers no slots on this day. 😌",
      slotFree: "Free", slotCont: "↳ continues", slotBlocked: "⛔ Blocked",
      tagConfirmed: "confirmed", tagPending: "pending",
      addManual: "+ Add manual appointment",
      emptyAppts: "No appointments yet. Message the AI from the phone on the left — the booking appears here instantly. ⚡",
      bookedByAi: "🤖 booked by AI", manualWord: "✍ manual",
      confirmedWord: "✓ confirmed", cancelledWord: "cancelled",
      sendReminder: "🔔 Send reminder", cancelBtn: "Cancel",
      blocksDesc: "Block times when you're not working (wedding, day off, errand) — the AI won't offer them to anyone.",
      blockReasonPh: "Reason (optional)", blockBtn: "Block",
      emptyBlocks: "No blocks. When you're off, block the time here — the AI won't offer it to anyone.",
      removeBtn: "Remove",
      notifsDesc: "When the AI isn't sure, it never guesses — it hands it to you. You see it here.",
      emptyNotifs: "No notifications yet. When the AI books, cancels, or isn't sure — you'll see it here.",
      statActive: "Active appointments", statAi: "Booked by AI (24/7, no owner needed)",
      statRevenue: "Booked revenue", statReminders: "Reminders sent",
      statAvoided: "No-shows prevented", statCancellations: "Cancellations (slot auto-freed)",
      statsNote: "These numbers are why the business renews its subscription every month without a second thought.",
      setupTitle: "Welcome! 👋",
      setupSub: "Your business ready for customers in <strong>under 5 minutes</strong> — that's our promise.",
      setupType: "Business type",
      setupName: "Business name",
      setupAddr: "Address", setupAddrPh: "e.g. 12 High Street, London",
      setupServices: "Services (name, minutes, price €)", addService: "+ Add service",
      svcNamePh: "Service name",
      setupHours: "Working hours", closedToggle: "closed",
      finishSetup: "Finish — I'm ready for customers ✓",
      manTitle: "Manual appointment", manSub: "For the customer who walks in or calls.",
      manClient: "Customer name", manService: "Service", manDate: "Date", manTime: "Time",
      manCancel: "Cancel", manSave: "Save appointment", noFreeSlots: "— no free slots —",
      sysWelcome: "This chat happens in the business's WhatsApp — the customer installs nothing",
      sysReminder: "Automatic reminder — sent by the system, owner didn't lift a finger",
      typing: "typing…",
      viewClient: "💬 Customer", viewPanel: "📊 Panel",
      toastBooked: "✅ Booking added to the calendar",
      toastCancelled: "🗑 Appointment cancelled — slot freed",
      toastReminder: "🔔 Reminder sent to the customer",
      toastBlocked: "⛔ Time blocked",
    },
    bot: {
      welcome: "Hello! 👋 Welcome to **{biz}**. I'm the booking assistant — tell me when you'd like to come and I'll find you a slot in 10 seconds, any hour of the day or night. 🌙",
      greeting: "Hi {name}! 👋 This is {biz} — how can I help? You can book a slot right here, just tell me the day.",
      offer: "For {date} ({svc}) I have these free: **{slots}**. Which one suits you?",
      offerOtherPeriod: "I'm busy in that window on {date}, but I do have: **{slots}**. Would any of these work?",
      dayFull: "Sorry, {date} I'm fully booked or closed. 😕 How about {next}? I have: **{slots}**",
      noneSoon: "Sorry, those days are full. Tell me another day and I'll find you a slot right away.",
      booked: "Booked! ✅\n**{date}, {time}**\n{svc} ({dur} min, {price}€)\n📍 {biz}{address}\n\nSee you there! If anything comes up, just message me here to change it.",
      justTaken: "Oh, that slot was just taken by someone else! ⚡ Still free: **{slots}**. Which one works?",
      takenNoAlt: "That slot was just taken and there's nothing else that day — tell me another day and I'll find one.",
      busyAt: "I'm busy at {time} on {date}. 😕 Closest free slots: **{slots}** — would any of these work?",
      busyPick: "I'm busy at {time} that day. Free slots: **{slots}** — does any of these suit you?",
      askDay: "Sure — {svc} ({dur} min, {price}€). Which day? (today, tomorrow, or a weekday)",
      askService: "Of course! Which service would you like?\n{services}",
      priceList: "Here are our services:\n{services}\n\nShall I book you a slot? Just tell me which day suits you. 📅",
      hoursReply: "📍 {address}\n\nOur hours:\n{hours}\n\nWant to book? Tell me the day!",
      cancelled: "Your appointment on {date} at {time} has been cancelled and the slot is free again. Whenever you want a new one, just message me — I'll find a slot in 10 seconds. 😉",
      noAppt: "I can't find an active appointment under your name. Did you book under a different name?",
      reminder: "Hi {name}! ⏰ A reminder about your appointment:\n**{date}, {time}** — {svc}\nat {biz}.\n\nWill you make it?",
      reminderYes: "Great, see you there! 🙌",
      reminderNo: "No problem, I've cancelled it and freed the slot. Want to rebook? Free that same day: **{slots}** — or tell me another day.",
      reminderNoNoAlt: "No problem, it's cancelled. Message me anytime for a new slot!",
      thanks: "You're welcome! 😊 See you soon.",
      unknown: "Good question — let me check that with the owner and I'll get back to you shortly! Meanwhile, if you'd like to book, I can find you a slot right away. 🙂",
      quickYes: "Yes, I confirm ✅", quickNo: "Can't make it ❌",
      notifBooked: "✅ New booking by AI: {name} — {svc}, {date} at {time}.",
      notifCancel: "❌ {name} cancelled the appointment on {date} at {time}. The slot was freed automatically.",
      notifUnknown: "❓ {name} asked something I can't handle: “{text}” — reply from the panel.",
    },
  },
};

const LANG_KEY = "rezervoai_lang";
// Zbulim automatik: shqipfolësit në shqip, gjithë bota tjetër në anglisht
let lang = localStorage.getItem(LANG_KEY) ||
  ((navigator.language || "").toLowerCase().startsWith("sq") ? "sq" : "en");
if (!I18N[lang]) lang = "sq";

function t(path, vars) {
  let cur = I18N[lang];
  for (const p of path.split(".")) cur = cur && cur[p];
  if (typeof cur === "string" && vars) {
    return cur.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : "{" + k + "}"));
  }
  return cur;
}

/* ---------------- Gjendja & ruajtja ---------------- */

const STORE_KEY = "rezervoai_demo_v1";
const SLOT_STEP = 30; // minuta

let state = load() || {
  config: null,
  appointments: [],       // {id, client, serviceId, date, time, status, source}
  blocks: [],              // {id, date, from, to, reason}
  notifications: [],       // {id, text, when, read}
  stats: { remindersSent: 0, remindersConfirmed: 0, cancellations: 0, aiBookings: 0 },
  nextId: 1,
};

function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
}
function uid() { return state.nextId++; }

/* ---------------- Ndihmës kohe ---------------- */

const pad = (n) => String(n).padStart(2, "0");
const toMin = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
const toHM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseDateStr(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }

function humanDate(dateStr) {
  const d = parseDateStr(dateStr);
  const today = fmtDate(new Date());
  const tomorrow = fmtDate(new Date(Date.now() + 864e5));
  const dn = t("dayNames")[d.getDay()];
  let label = `${lang === "sq" ? dn.toLowerCase() : dn}, ${d.getDate()} ${t("months")[d.getMonth()]}`;
  if (dateStr === today) label = `${t("ui.todayWord")} (${label})`;
  else if (dateStr === tomorrow) label = `${t("ui.tomorrowWord")} (${label})`;
  return label;
}

function nowHM() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

/* =====================================================================
   (1) MOTORI I REZERVIMEVE — burimi i vetëm i së vërtetës.
   AI nuk shpik kurrë orare: vetëm pyet këto funksione.
   ===================================================================== */

function serviceById(id) { return state.config.services.find((s) => s.id === id); }

function activeAppts(dateStr) {
  return state.appointments.filter((a) => a.date === dateStr && a.status !== "cancelled");
}

function freeSlots(dateStr, durMin) {
  const d = parseDateStr(dateStr);
  const hours = state.config.hours[d.getDay()];
  if (!hours) return [];

  const open = toMin(hours[0]);
  const close = toMin(hours[1]);
  const appts = activeAppts(dateStr).map((a) => {
    const s = serviceById(a.serviceId);
    return [toMin(a.time), toMin(a.time) + (s ? s.dur : SLOT_STEP)];
  });
  const blocks = state.blocks.filter((b) => b.date === dateStr)
    .map((b) => [toMin(b.from), toMin(b.to)]);
  const busy = appts.concat(blocks);
  const isToday = dateStr === fmtDate(new Date());

  const out = [];
  for (let tt = open; tt + durMin <= close; tt += SLOT_STEP) {
    if (isToday && tt <= nowHM()) continue;
    const clash = busy.some(([s, e]) => tt < e && tt + durMin > s);
    if (!clash) out.push(toHM(tt));
  }
  return out;
}

/** Rezervim transaksional: rikontroll në momentin e regjistrimit —
    dyfishimi i orarit është i pamundur me dizajn. */
function book(client, serviceId, dateStr, time, source) {
  const svc = serviceById(serviceId);
  if (!svc) return { ok: false, reason: "service" };
  if (!freeSlots(dateStr, svc.dur).includes(time)) {
    return { ok: false, reason: "taken", alternatives: freeSlots(dateStr, svc.dur).slice(0, 3) };
  }
  const appt = {
    id: uid(), client, serviceId, date: dateStr, time,
    status: "pending", source: source || "ai",
  };
  state.appointments.push(appt);
  if (source === "ai") state.stats.aiBookings++;
  save();
  renderAll();
  return { ok: true, appt };
}

function cancelAppt(id, byClient) {
  const a = state.appointments.find((x) => x.id === id);
  if (!a || a.status === "cancelled") return false;
  a.status = "cancelled";
  state.stats.cancellations++;
  if (byClient) {
    notify(t("bot.notifCancel", { name: a.client, date: humanDate(a.date), time: a.time }));
  }
  showToast(t("ui.toastCancelled"));
  save();
  renderAll();
  return true;
}

function upcomingApptsFor(client) {
  const today = fmtDate(new Date());
  return state.appointments
    .filter((a) => a.client.toLowerCase() === client.toLowerCase() &&
                   a.status !== "cancelled" &&
                   (a.date > today || (a.date === today && toMin(a.time) > nowHM())))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function notify(text) {
  state.notifications.unshift({
    id: uid(), text,
    when: new Date().toLocaleTimeString(t("locale"), { hour: "2-digit", minute: "2-digit" }),
    read: false,
  });
  save();
  renderNotifications();
}

/* =====================================================================
   (2) BISEDA AI — kupton shqip dhe anglisht, rezervon vetëm përmes motorit.
   (Në produksion: LLM me tool-use mbi të njëjtat funksione, çdo gjuhë.)
   ===================================================================== */

const chatCtx = { serviceId: null, date: null, offered: [], awaiting: null, reminderApptId: null };

function norm(s) {
  return s.toLowerCase()
    .replace(/ë/g, "e").replace(/ç/g, "c")
    .replace(/[’']/g, " ").replace(/\s+/g, " ").trim();
}

function parseDay(text) {
  const tx = norm(text);
  const today = new Date();
  if (tx.includes("pasneser") || tx.includes("day after tomorrow")) {
    return fmtDate(new Date(Date.now() + 2 * 864e5));
  }
  if (tx.includes("neser") || tx.includes("tomorrow")) return fmtDate(new Date(Date.now() + 864e5));
  if (/\bsot\b/.test(tx) || /\btoday\b/.test(tx) || /\btonight\b/.test(tx)) return fmtDate(today);
  const days = [
    ["e diel", 0], ["sunday", 0],
    ["e hene", 1], ["te henen", 1], ["monday", 1],
    ["e marte", 2], ["te marten", 2], ["tuesday", 2],
    ["e merkure", 3], ["te merkuren", 3], ["wednesday", 3],
    ["e enjte", 4], ["te enjten", 4], ["thursday", 4],
    ["e premte", 5], ["te premten", 5], ["friday", 5],
    ["e shtune", 6], ["te shtunen", 6], ["saturday", 6],
  ];
  for (const [name, dow] of days) {
    if (tx.includes(name)) {
      const d = new Date(today);
      let diff = (dow - d.getDay() + 7) % 7;
      if (diff === 0) diff = 7; // "friday" said on a Friday = next week
      d.setDate(d.getDate() + diff);
      return fmtDate(d);
    }
  }
  return null;
}

function parsePeriod(text) {
  const tx = norm(text);
  if (tx.includes("paradite") || tx.includes("mengjes") || tx.includes("morning")) return [0, 12 * 60];
  if (tx.includes("pasdite") || tx.includes("dreke") || tx.includes("afternoon") || tx.includes("noon")) return [12 * 60, 18 * 60];
  if (tx.includes("mbremje") || tx.includes("darke") || tx.includes("evening") || tx.includes("tonight")) return [17 * 60, 24 * 60];
  return null;
}

function parseTime(text) {
  const tx = norm(text);
  let h = null, min = 0, mer = null;

  let m = tx.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/);
  if (m) { h = +m[1]; min = +m[2]; mer = m[3] || null; }
  else {
    m = tx.match(/\b(\d{1,2})\s*(am|pm)\b/);
    if (m) { h = +m[1]; mer = m[2]; }
    else {
      m = tx.match(/\b(?:ora|oren|ne|tek?|at)\s+(\d{1,2})\b/) || tx.match(/^(\d{1,2})$/);
      if (m) h = +m[1];
    }
  }
  if (h === null || h > 23 || min > 59) return null;
  if (mer === "pm" && h < 12) h += 12;
  else if (mer === "am" && h === 12) h = 0;
  else if (!mer && h >= 1 && h <= 7) h += 12; // "at 4" = 16:00 — service businesses work daytime
  return toHM(h * 60 + min);
}

function parseService(text) {
  const tx = norm(text);
  let best = null, bestScore = 0;
  for (const s of state.config.services) {
    const words = norm(s.name).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    const score = words.filter((w) => tx.includes(w.slice(0, 4))).length;
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best;
}

function svcList() {
  return state.config.services
    .map((s) => `• ${s.name} — ${s.dur} min — ${s.price}€`).join("\n");
}

function hoursList() {
  const h = state.config.hours;
  return t("dayNames")
    .map((n, i) => `${n}: ${h[i] ? h[i][0] + "–" + h[i][1] : t("ui.closedToggle")}`)
    .join("\n");
}

function offerSlots(dateStr, svc, period) {
  let slots = freeSlots(dateStr, svc.dur);
  if (period) slots = slots.filter((x) => toMin(x) >= period[0] && toMin(x) < period[1]);
  chatCtx.serviceId = svc.id; chatCtx.date = dateStr;

  if (!slots.length) {
    chatCtx.offered = [];
    const all = freeSlots(dateStr, svc.dur);
    if (all.length) {
      chatCtx.offered = all.slice(0, 3);
      chatCtx.awaiting = "pick";
      return t("bot.offerOtherPeriod", { date: humanDate(dateStr), slots: chatCtx.offered.join(", ") });
    }
    const next = new Date(parseDateStr(dateStr)); next.setDate(next.getDate() + 1);
    const nextStr = fmtDate(next);
    const nextSlots = freeSlots(nextStr, svc.dur).slice(0, 3);
    if (nextSlots.length) {
      chatCtx.date = nextStr; chatCtx.offered = nextSlots; chatCtx.awaiting = "pick";
      return t("bot.dayFull", { date: humanDate(dateStr), next: humanDate(nextStr), slots: nextSlots.join(", ") });
    }
    return t("bot.noneSoon");
  }
  chatCtx.offered = slots.slice(0, 3);
  chatCtx.awaiting = "pick";
  return t("bot.offer", { date: humanDate(dateStr), svc: svc.name, slots: chatCtx.offered.join(", ") });
}

function confirmBooking(time) {
  const svc = serviceById(chatCtx.serviceId);
  const res = book(clientName(), chatCtx.serviceId, chatCtx.date, time, "ai");
  if (!res.ok) {
    if (res.alternatives && res.alternatives.length) {
      chatCtx.offered = res.alternatives;
      return t("bot.justTaken", { slots: res.alternatives.join(", ") });
    }
    return t("bot.takenNoAlt");
  }
  notify(t("bot.notifBooked", { name: clientName(), svc: svc.name, date: humanDate(chatCtx.date), time }));
  showToast(t("ui.toastBooked"));
  const msg = t("bot.booked", {
    date: humanDate(chatCtx.date), time, svc: svc.name, dur: svc.dur,
    price: svc.price, biz: state.config.businessName,
    address: state.config.address ? ", " + state.config.address : "",
  });
  chatCtx.offered = []; chatCtx.awaiting = null; chatCtx.serviceId = null; chatCtx.date = null;
  return msg;
}

function botReply(text) {
  const tx = norm(text);

  /* --- përgjigje ndaj kujtesës / reminder reply --- */
  if (chatCtx.awaiting === "reminder") {
    const appt = state.appointments.find((a) => a.id === chatCtx.reminderApptId);
    chatCtx.awaiting = null;
    if (/(^| )(po|posi|sigurisht|konfirmoj|vij|ok|dakord|yes|yeah|yep|sure|confirm)( |$|!|\.|,)/.test(tx)) {
      if (appt) { appt.status = "confirmed"; state.stats.remindersConfirmed++; save(); renderAll(); }
      return t("bot.reminderYes");
    }
    if (/(s ?vij|nuk vij|jo|anulo|shtyj|nuk mundem|s mundem|no|can ?t|cannot|won ?t|cancel)/.test(tx)) {
      if (appt) {
        cancelAppt(appt.id, true);
        const svc = serviceById(appt.serviceId);
        const alt = freeSlots(appt.date, svc.dur).slice(0, 3);
        chatCtx.serviceId = appt.serviceId; chatCtx.date = appt.date;
        chatCtx.offered = alt; chatCtx.awaiting = alt.length ? "pick" : null;
        return alt.length
          ? t("bot.reminderNo", { slots: alt.join(", ") })
          : t("bot.reminderNoNoAlt");
      }
      return t("bot.reminderNoNoAlt");
    }
  }

  /* --- anulim / cancellation --- */
  if (/(anulo|anullo|s ?vij dot|nuk vij dot|hiqe takimin|fshije takimin|\bcancel\b|can ?t (come|make)|cannot (come|make))/.test(tx)) {
    const appts = upcomingApptsFor(clientName());
    if (!appts.length) return t("bot.noAppt");
    const a = appts[0];
    cancelAppt(a.id, true);
    return t("bot.cancelled", { date: humanDate(a.date), time: a.time });
  }

  /* --- zgjedhje nga oraret e ofruara / picking an offered slot --- */
  if (chatCtx.offered.length && chatCtx.serviceId && chatCtx.date) {
    const time = parseTime(tx);
    if (time && chatCtx.offered.includes(time)) return confirmBooking(time);
    const ord = tx.match(/(e para|i pari|first|1st|^1$|e dyta|i dyti|second|2nd|^2$|e treta|i treti|third|3rd|^3$)/);
    if (ord) {
      const idx = /para|pari|first|1st|^1$/.test(ord[1]) ? 0
                : /dyta|dyti|second|2nd|^2$/.test(ord[1]) ? 1 : 2;
      if (chatCtx.offered[idx]) return confirmBooking(chatCtx.offered[idx]);
    }
    if (time) {
      const svc = serviceById(chatCtx.serviceId);
      if (freeSlots(chatCtx.date, svc.dur).includes(time)) return confirmBooking(time);
      return t("bot.busyPick", { time, slots: chatCtx.offered.join(", ") });
    }
    if (/(^| )(po|ok|dakord|mire|ne rregull|yes|yeah|sure|fine)( |$)/.test(tx) && chatCtx.offered.length === 1) {
      return confirmBooking(chatCtx.offered[0]);
    }
  }

  /* --- pyetje çmimi / price question --- */
  if (/(sa kushton|cmim|qmim|sa eshte|sa ben|cmimet|sherbimet|\bprices?\b|\bcost\b|how much|pricing|your services)/.test(tx)) {
    return t("bot.priceList", { services: svcList() });
  }

  /* --- orari i punës / adresa — hours & address --- */
  if (/(kur jeni hapur|orari i punes|ne cfare ore|sa hapeni|kur mbyllni|adresa|ku ndodheni|ku jeni|opening hours|working hours|when are you open|what time do you (open|close)|\baddress\b|where are you|location)/.test(tx)) {
    return t("bot.hoursReply", { address: state.config.address || state.config.businessName, hours: hoursList() });
  }

  /* --- synim rezervimi / booking intent --- */
  const wantsBooking = /(orar|rezervo|takim|termin|te vij|a ke|a keni|dua te|kur ke|me zer|me cakto|\bbook\b|\bbooking\b|appointment|\breserve\b|\bschedule\b|\bslot\b|availab|do you have|can i (come|get|book)|i( would|d) like)/.test(tx);
  const day = parseDay(tx);
  const period = parsePeriod(tx);
  const time = parseTime(tx);
  const svc = parseService(tx);

  if (wantsBooking || day || svc) {
    const service = svc || (chatCtx.serviceId ? serviceById(chatCtx.serviceId) : null);
    const date = day || chatCtx.date;

    if (!service && state.config.services.length === 1) {
      return handleBookingWith(state.config.services[0], date, time, period);
    }
    if (!service) {
      if (date) chatCtx.date = date;
      chatCtx.awaiting = "service";
      return t("bot.askService", { services: svcList() });
    }
    return handleBookingWith(service, date, time, period);
  }

  /* --- klienti tregoi shërbimin që i kërkuam / answering the service question --- */
  if (chatCtx.awaiting === "service") {
    const s = parseService(tx);
    if (s) { chatCtx.awaiting = null; return handleBookingWith(s, chatCtx.date, parseTime(tx), parsePeriod(tx)); }
  }

  /* --- përshëndetje / greeting --- */
  if (/\b(pershendetje|ckemi|tung|hello|hi|hey|miremengjes|mirembrema|miredita|good (morning|afternoon|evening))\b/.test(tx) && tx.length < 40) {
    return t("bot.greeting", { name: clientName(), biz: state.config.businessName });
  }

  /* --- falënderim / thanks --- */
  if (/(faleminderit|flm|rrofsh|shume mire|thank|thanks|thx|cheers)/.test(tx)) return t("bot.thanks");

  /* --- e panjohur → kurrë mos hamendëso / unknown → never guess --- */
  notify(t("bot.notifUnknown", { name: clientName(), text }));
  return t("bot.unknown");
}

function handleBookingWith(service, date, time, period) {
  chatCtx.serviceId = service.id;
  if (!date) {
    chatCtx.awaiting = "day";
    return t("bot.askDay", { svc: service.name, dur: service.dur, price: service.price });
  }
  if (time) {
    if (freeSlots(date, service.dur).includes(time)) {
      chatCtx.date = date;
      return confirmBooking(time);
    }
    chatCtx.date = date;
    const alt = freeSlots(date, service.dur)
      .sort((a, b) => Math.abs(toMin(a) - toMin(time)) - Math.abs(toMin(b) - toMin(time)))
      .slice(0, 3).sort((a, b) => toMin(a) - toMin(b));
    if (alt.length) {
      chatCtx.offered = alt; chatCtx.awaiting = "pick";
      return t("bot.busyAt", { time, date: humanDate(date), slots: alt.join(", ") });
    }
    return offerSlots(date, service, null);
  }
  return offerSlots(date, service, period);
}

/* =====================================================================
   (3) NDËRFAQJA
   ===================================================================== */

const $ = (sel) => document.querySelector(sel);
const chatEl = $("#chat");

function clientName() { return $("#clientName").value.trim() || "Andi"; }

/* Njoftim "toast" — feedback i çastit për çdo veprim, si app nativ */
let toastTimer;
function showToast(text) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function timeStamp() {
  return new Date().toLocaleTimeString(t("locale"), { hour: "2-digit", minute: "2-digit" });
}

function addMsg(text, who) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerHTML = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    + `<span class="meta">${timeStamp()}${who === "me" ? " ✓✓" : ""}</span>`;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function addSys(text) {
  const div = document.createElement("div");
  div.className = "msg sys";
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setQuickReplies(options) {
  const box = $("#quickReplies");
  box.innerHTML = "";
  for (const opt of options) {
    const b = document.createElement("button");
    b.textContent = opt;
    b.onclick = () => { box.innerHTML = ""; clientSays(opt); };
    box.appendChild(b);
  }
}

function botSays(text, delay) {
  $("#waStatus").textContent = t("ui.typing");
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.innerHTML = "<span></span><span></span><span></span>";
  chatEl.appendChild(typing);
  chatEl.scrollTop = chatEl.scrollHeight;
  setTimeout(() => {
    typing.remove();
    $("#waStatus").textContent = "online";
    addMsg(text, "bot");
  }, delay || 700);
}

function clientSays(text) {
  addMsg(text, "me");
  const reply = botReply(text);
  botSays(reply);
}

$("#chatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  $("#quickReplies").innerHTML = "";
  clientSays(text);
});

/* ---------------- Kujtesa (nga paneli) ---------------- */

function sendReminder(apptId) {
  const a = state.appointments.find((x) => x.id === apptId);
  if (!a || a.status === "cancelled") return;
  const svc = serviceById(a.serviceId);
  state.stats.remindersSent++;
  save();
  showToast(t("ui.toastReminder"));
  addSys(t("ui.sysReminder"));
  botSays(t("bot.reminder", {
    name: a.client, date: humanDate(a.date), time: a.time,
    svc: svc.name, biz: state.config.businessName,
  }), 500);
  chatCtx.awaiting = "reminder";
  chatCtx.reminderApptId = a.id;
  setTimeout(() => setQuickReplies([t("bot.quickYes"), t("bot.quickNo")]), 1300);
  renderStats();
}

/* ---------------- Paneli: tabs ---------------- */

document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((x) => x.classList.remove("active"));
    tab.classList.add("active");
    $("#pane-" + tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "notifications") {
      state.notifications.forEach((n) => (n.read = true));
      save();
      renderNotifications();
    }
  };
});

/* ---------------- Paneli: kalendari ---------------- */

let calDate = fmtDate(new Date());

$("#calPrev").onclick = () => { shiftCal(-1); };
$("#calNext").onclick = () => { shiftCal(1); };
$("#calToday").onclick = () => { calDate = fmtDate(new Date()); renderCalendar(); };
function shiftCal(days) {
  const d = parseDateStr(calDate);
  d.setDate(d.getDate() + days);
  calDate = fmtDate(d);
  renderCalendar();
}

function renderCalendar() {
  const d = parseDateStr(calDate);
  $("#calDateLabel").textContent =
    `${t("dayNames")[d.getDay()]}, ${d.getDate()} ${t("months")[d.getMonth()]} ${d.getFullYear()}`;
  const tl = $("#timeline");
  tl.innerHTML = "";
  const hours = state.config.hours[d.getDay()];
  if (!hours) {
    tl.innerHTML = `<div class="empty">${t("ui.dayOff")}</div>`;
    return;
  }
  const open = toMin(hours[0]), close = toMin(hours[1]);
  const appts = activeAppts(calDate);
  const blocks = state.blocks.filter((b) => b.date === calDate);

  for (let tt = open; tt < close; tt += SLOT_STEP) {
    const hm = toHM(tt);
    const row = document.createElement("div");
    const appt = appts.find((a) => {
      const s = serviceById(a.serviceId);
      const st = toMin(a.time);
      return tt >= st && tt < st + (s ? s.dur : SLOT_STEP);
    });
    const block = blocks.find((b) => tt >= toMin(b.from) && tt < toMin(b.to));

    if (appt) {
      const s = serviceById(appt.serviceId);
      const isStart = toMin(appt.time) === tt;
      row.className = "slot busy";
      row.innerHTML = `<span class="time">${hm}</span>
        <span class="label">${isStart ? `<strong>${appt.client}</strong> — ${s.name} (${s.price}€)` : t("ui.slotCont")}</span>
        ${isStart ? `<span class="tag ${appt.status === "confirmed" ? "confirmed" : "pending"}">${appt.status === "confirmed" ? t("ui.tagConfirmed") : t("ui.tagPending")}</span>` : ""}`;
    } else if (block) {
      row.className = "slot blocked";
      row.innerHTML = `<span class="time">${hm}</span><span class="label">${t("ui.slotBlocked")}${block.reason ? " — " + block.reason : ""}</span>`;
    } else {
      row.className = "slot free";
      row.innerHTML = `<span class="time">${hm}</span><span class="label">${t("ui.slotFree")}</span>`;
    }
    tl.appendChild(row);
  }
}

/* ---------------- Paneli: takimet ---------------- */

function renderAppointments() {
  const list = $("#apptList");
  list.innerHTML = "";
  const sorted = [...state.appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (!sorted.length) {
    list.innerHTML = `<div class="empty">${t("ui.emptyAppts")}</div>`;
    return;
  }
  for (const a of sorted) {
    const s = serviceById(a.serviceId);
    const d = parseDateStr(a.date);
    const card = document.createElement("div");
    card.className = "appt-card" + (a.status === "cancelled" ? " cancelled" : "");
    card.innerHTML = `
      <div class="appt-when">${a.time}<small>${d.getDate()} ${t("months")[d.getMonth()].slice(0, 3)}</small></div>
      <div class="appt-info">
        <div class="who">${a.client}</div>
        <div class="what">${s ? `${s.name} • ${s.price}€` : ""} • ${a.source === "ai" ? t("ui.bookedByAi") : t("ui.manualWord")}
          ${a.status === "confirmed" ? ` • <span style="color:var(--green)">${t("ui.confirmedWord")}</span>` : ""}
          ${a.status === "cancelled" ? ` • <span style="color:var(--red)">${t("ui.cancelledWord")}</span>` : ""}
        </div>
      </div>
      <div class="appt-actions"></div>`;
    const actions = card.querySelector(".appt-actions");
    if (a.status !== "cancelled") {
      const remind = document.createElement("button");
      remind.className = "btn small";
      remind.textContent = t("ui.sendReminder");
      remind.onclick = () => sendReminder(a.id);
      actions.appendChild(remind);
      const cancel = document.createElement("button");
      cancel.className = "btn small ghost danger";
      cancel.textContent = t("ui.cancelBtn");
      cancel.onclick = () => cancelAppt(a.id, false);
      actions.appendChild(cancel);
    }
    list.appendChild(card);
  }
}

/* ---------------- Paneli: takim manual ---------------- */

$("#btnAddAppt").onclick = () => {
  const sel = $("#manService");
  sel.innerHTML = state.config.services
    .map((s) => `<option value="${s.id}">${s.name} (${s.dur} min, ${s.price}€)</option>`).join("");
  $("#manDate").value = calDate;
  refreshManTimes();
  $("#apptModal").hidden = false;
  setTimeout(() => $("#manClient").focus(), 60);
};
$("#manService").addEventListener("change", refreshManTimes);
$("#manDate").addEventListener("change", refreshManTimes);
function refreshManTimes() {
  const svc = serviceById(+$("#manService").value);
  const slots = svc && $("#manDate").value ? freeSlots($("#manDate").value, svc.dur) : [];
  $("#manTime").innerHTML = slots.length
    ? slots.map((x) => `<option>${x}</option>`).join("")
    : `<option value="">${t("ui.noFreeSlots")}</option>`;
}
$("#manCancel").onclick = () => { $("#apptModal").hidden = true; };
$("#manSave").onclick = () => {
  const client = $("#manClient").value.trim();
  const time = $("#manTime").value;
  if (!client || !time) return;
  book(client, +$("#manService").value, $("#manDate").value, time, "manual");
  $("#apptModal").hidden = true;
  $("#manClient").value = "";
};

/* ---------------- Paneli: bllokimet ---------------- */

$("#blockForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const from = $("#blockFrom").value, to = $("#blockTo").value;
  if (toMin(to) <= toMin(from)) return;
  state.blocks.push({
    id: uid(), date: $("#blockDate").value, from, to,
    reason: $("#blockReason").value.trim(),
  });
  save();
  showToast(t("ui.toastBlocked"));
  e.target.reset();
  renderAll();
});

function renderBlocks() {
  const list = $("#blockList");
  list.innerHTML = "";
  if (!state.blocks.length) {
    list.innerHTML = `<div class="empty">${t("ui.emptyBlocks")}</div>`;
    return;
  }
  for (const b of state.blocks) {
    const item = document.createElement("div");
    item.className = "block-item";
    item.innerHTML = `<span class="grow">⛔ ${humanDate(b.date)} • ${b.from}–${b.to}${b.reason ? " — " + b.reason : ""}</span>`;
    const del = document.createElement("button");
    del.className = "btn small ghost danger";
    del.textContent = t("ui.removeBtn");
    del.onclick = () => {
      state.blocks = state.blocks.filter((x) => x.id !== b.id);
      save();
      renderAll();
    };
    item.appendChild(del);
    list.appendChild(item);
  }
}

/* ---------------- Paneli: njoftimet ---------------- */

function renderNotifications() {
  const list = $("#notifList");
  const unread = state.notifications.filter((n) => !n.read).length;
  const badge = $("#notifBadge");
  badge.hidden = unread === 0;
  badge.textContent = unread;
  list.innerHTML = "";
  if (!state.notifications.length) {
    list.innerHTML = `<div class="empty">${t("ui.emptyNotifs")}</div>`;
    return;
  }
  for (const n of state.notifications) {
    const item = document.createElement("div");
    item.className = "notif-item" + (n.read ? "" : " unread");
    item.innerHTML = `<div class="grow">${n.text}<div class="when">${n.when}</div></div>`;
    list.appendChild(item);
  }
}

/* ---------------- Paneli: statistika ---------------- */

function renderStats() {
  const active = state.appointments.filter((a) => a.status !== "cancelled");
  const revenue = active.reduce((sum, a) => {
    const s = serviceById(a.serviceId);
    return sum + (s ? s.price : 0);
  }, 0);
  const grid = $("#statsGrid");
  grid.innerHTML = `
    <div class="stat-card"><div class="num">${active.length}</div><div class="lbl">${t("ui.statActive")}</div></div>
    <div class="stat-card"><div class="num">${state.stats.aiBookings}</div><div class="lbl">${t("ui.statAi")}</div></div>
    <div class="stat-card highlight"><div class="num">${revenue}€</div><div class="lbl">${t("ui.statRevenue")}</div></div>
    <div class="stat-card"><div class="num">${state.stats.remindersSent}</div><div class="lbl">${t("ui.statReminders")}</div></div>
    <div class="stat-card highlight"><div class="num">${state.stats.remindersConfirmed}</div><div class="lbl">${t("ui.statAvoided")}</div></div>
    <div class="stat-card"><div class="num">${state.stats.cancellations}</div><div class="lbl">${t("ui.statCancellations")}</div></div>`;
}

/* ---------------- Magjistari i regjistrimit ---------------- */

function defaultConfig() {
  const p = t("presets.barber");
  return {
    type: "barber",
    businessName: p.nameEx,
    address: lang === "en" ? "12 High Street, London" : "Rruga e Durrësit 12, Tiranë",
    services: p.services.map((s, i) => ({ id: i + 1, ...s })),
    hours: { 0: null, 1: ["09:00", "19:00"], 2: ["09:00", "19:00"], 3: ["09:00", "19:00"],
             4: ["09:00", "19:00"], 5: ["09:00", "19:00"], 6: ["09:00", "19:00"] },
  };
}

function fillTypeSelect(selected) {
  const sel = $("#setupType");
  const presets = t("presets");
  sel.innerHTML = Object.keys(presets)
    .map((k) => `<option value="${k}">${presets[k].label}</option>`).join("");
  sel.value = presets[selected] ? selected : "barber";
}

$("#setupType").addEventListener("change", () => {
  const p = t("presets." + $("#setupType").value);
  const svcBox = $("#setupServices");
  svcBox.innerHTML = "";
  p.services.forEach((s) => addServiceRow(s));
  $("#setupName").value = p.nameEx;
});

function openSetup(prefill) {
  const cfg = prefill || defaultConfig();
  fillTypeSelect(cfg.type || "barber");
  $("#setupName").value = cfg.businessName;
  $("#setupAddress").value = cfg.address;

  const svcBox = $("#setupServices");
  svcBox.innerHTML = "";
  cfg.services.forEach((s) => addServiceRow(s));

  const hoursBox = $("#setupHours");
  hoursBox.innerHTML = "";
  for (let i = 1; i <= 7; i++) {
    const dow = i % 7; // E hëna e para / Monday first
    const h = cfg.hours[dow];
    const row = document.createElement("div");
    row.className = "hours-row";
    row.dataset.dow = dow;
    row.innerHTML = `
      <span class="day">${t("dayNames")[dow]}</span>
      <input type="time" class="h-open" value="${h ? h[0] : "09:00"}" ${h ? "" : "disabled"}>
      <span>–</span>
      <input type="time" class="h-close" value="${h ? h[1] : "19:00"}" ${h ? "" : "disabled"}>
      <label class="closed-toggle"><input type="checkbox" class="h-closed" ${h ? "" : "checked"}> ${t("ui.closedToggle")}</label>`;
    row.querySelector(".h-closed").addEventListener("change", (e) => {
      row.querySelector(".h-open").disabled = e.target.checked;
      row.querySelector(".h-close").disabled = e.target.checked;
    });
    hoursBox.appendChild(row);
  }
  $("#setupModal").hidden = false;
}

function addServiceRow(s) {
  const row = document.createElement("div");
  row.className = "service-row";
  row.innerHTML = `
    <input class="s-name" type="text" placeholder="${t("ui.svcNamePh")}" value="${s ? s.name : ""}" maxlength="40">
    <input class="s-dur" type="number" placeholder="min" min="10" max="240" step="5" value="${s ? s.dur : 30}">
    <input class="s-price" type="number" placeholder="€" min="0" step="0.5" value="${s ? s.price : ""}">
    <button class="s-del" type="button" title="✕">✕</button>`;
  row.querySelector(".s-del").onclick = () => row.remove();
  $("#setupServices").appendChild(row);
}

$("#btnAddService").onclick = () => addServiceRow(null);

/* ---------------- Të dhëna shembull (demo që duket si biznes i gjallë) ---------------- */

const SAMPLE_NAMES = {
  sq: ["Andi", "Erjon", "Klara", "Drini", "Megi", "Festim", "Albana", "Gentian", "Sara", "Bledi"],
  en: ["James", "Olivia", "Liam", "Emma", "Noah", "Sophia", "Lucas", "Mia", "Ethan", "Ava"],
};

function nextWorkingDays(n) {
  const out = [];
  for (let i = 0; i < 21 && out.length < n; i++) {
    const d = new Date(Date.now() + i * 864e5);
    if (state.config.hours[d.getDay()]) out.push(fmtDate(d));
  }
  return out;
}

/** Mbush kalendarin me pak takime realiste që demoja të mos jetë bosh. */
function seedSampleData() {
  const names = SAMPLE_NAMES[lang] || SAMPLE_NAMES.en;
  const days = nextWorkingDays(3);
  let ni = Math.floor(Math.random() * names.length);

  days.forEach((date, di) => {
    const want = di === 0 ? 2 : 3;
    for (let k = 0; k < want; k++) {
      const svc = state.config.services[Math.floor(Math.random() * state.config.services.length)];
      const slots = freeSlots(date, svc.dur);
      if (!slots.length) break;
      const time = slots[Math.floor(Math.random() * slots.length)];
      const confirmed = Math.random() < 0.5;
      state.appointments.push({
        id: uid(), client: names[ni % names.length], serviceId: svc.id,
        date, time, status: confirmed ? "confirmed" : "pending",
        source: Math.random() < 0.75 ? "ai" : "manual",
      });
      if (state.appointments[state.appointments.length - 1].source === "ai") state.stats.aiBookings++;
      if (confirmed) state.stats.remindersConfirmed++;
      ni++;
    }
  });
  state.stats.remindersSent = state.stats.remindersConfirmed + 1;
  save();
}

function draftFromForm() {
  const services = [...document.querySelectorAll(".service-row")]
    .map((row, i) => ({
      id: i + 1,
      name: row.querySelector(".s-name").value.trim(),
      dur: Math.max(10, +row.querySelector(".s-dur").value || 30),
      price: +row.querySelector(".s-price").value || 0,
    }))
    .filter((s) => s.name);
  const hours = {};
  document.querySelectorAll(".hours-row").forEach((row) => {
    const closed = row.querySelector(".h-closed").checked;
    hours[row.dataset.dow] = closed ? null
      : [row.querySelector(".h-open").value || "09:00", row.querySelector(".h-close").value || "19:00"];
  });
  return {
    type: $("#setupType").value,
    businessName: $("#setupName").value.trim(),
    address: $("#setupAddress").value.trim(),
    services, hours,
  };
}

$("#btnFinishSetup").onclick = () => {
  const draft = draftFromForm();
  if (!draft.services.length) { addServiceRow(null); return; }
  if (!draft.businessName) draft.businessName = t("presets." + draft.type + ".nameEx");
  state.config = draft;
  if (!state.appointments.length) seedSampleData(); // demo që duket e gjallë
  save();
  $("#setupModal").hidden = true;
  applyConfig();
  if (!chatEl.children.length) welcome();
};

$("#btnSettings").onclick = () => openSetup(state.config);
$("#btnReset").onclick = () => {
  if (!confirm(t("ui.resetConfirm"))) return;
  localStorage.removeItem(STORE_KEY);
  location.reload();
};

/* ---------------- Aksesueshmëria e modaleve ---------------- */
// ESC mbyll modalin (setup-in vetëm kur biznesi është konfiguruar tashmë)
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("#apptModal").hidden) $("#apptModal").hidden = true;
  else if (!$("#setupModal").hidden && state.config) $("#setupModal").hidden = true;
});
// Klik jashtë kartës mbyll modalin e takimit manual
$("#apptModal").addEventListener("click", (e) => {
  if (e.target === $("#apptModal")) $("#apptModal").hidden = true;
});

/* ---------------- Gjuha / Language ---------------- */

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("#langSwitch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  $("#phoneHintText").innerHTML = t("ui.hint");
  $("#setupSub").innerHTML = t("ui.setupSub");

  const chips = $("#hintChips");
  chips.innerHTML = "";
  for (const text of t("ui.chips")) {
    const c = document.createElement("button");
    c.className = "chip";
    c.textContent = `«${text}»`;
    c.onclick = () => { $("#chatInput").value = text; $("#chatInput").focus(); };
    chips.appendChild(c);
  }

  if (state.config) {
    applyConfig();
  } else if (!$("#setupModal").hidden) {
    openSetup(null); // rifresko magjistarin me gjuhën e re / refresh wizard in new language
  }
}

document.querySelectorAll("#langSwitch button").forEach((b) => {
  b.onclick = () => {
    if (b.dataset.lang === lang) return;
    const setupOpen = !$("#setupModal").hidden && state.config === null;
    lang = b.dataset.lang;
    localStorage.setItem(LANG_KEY, lang);
    applyLang();
    if (setupOpen) openSetup(null);
  };
});

/* ---------------- Navigimi mobile (Klienti ↔ Paneli) ---------------- */

document.body.classList.add("view-client");
document.querySelectorAll("#viewSwitch button").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll("#viewSwitch button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    document.body.classList.toggle("view-client", b.dataset.view === "client");
    document.body.classList.toggle("view-panel", b.dataset.view === "panel");
    window.scrollTo({ top: 0 });
  };
});

/* ---------------- Nisja ---------------- */

function applyConfig() {
  $("#waBizName").textContent = state.config.businessName;
  $("#waAvatar").textContent = state.config.businessName.charAt(0).toUpperCase();
  $("#panelBizName").textContent = t("ui.panelPrefix") + state.config.businessName;
  renderAll();
}

function renderAll() {
  renderCalendar();
  renderAppointments();
  renderBlocks();
  renderNotifications();
  renderStats();
}

function welcome() {
  addSys(t("ui.sysWelcome"));
  botSays(t("bot.welcome", { biz: state.config.businessName }), 900);
}

applyLang();
if (state.config) {
  applyConfig();
  welcome();
} else {
  openSetup(null);
}

/* PWA: platforma instalohet si app në telefon dhe hapet edhe offline */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
