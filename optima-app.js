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
    obServices: "Shërbimet / Produktet", addService: "+ Shto shërbim",
    unitMin: "min", unitHour: "orë", unitDay: "ditë", unitWeek: "javë", unitMonth: "muaj", unitYear: "vit", unitNone: "— pa kohë",
    obHours: "Orari i punës", closed: "pushim",
    obFinish: "Përfundo — jam gati ✓", svcNamePh: "Emri i shërbimit",
    logout: "Dil", panelPrefix: "Paneli — ",
    tabCal: "📅 Kalendari", tabAppt: "📋 Takimet", tabBlock: "⛔ Bllokime", tabStat: "🏠 Përmbledhje",
    grpHome: "Kreu", grpWork: "Puna", grpBiz: "Biznesi", grpOther: "Tjera",
    grpDaily: "Përdor çdo ditë", grpSetup: "Rregullo një herë", tabConfig: "🚀 Konfigurimi", optional: "opsionale",
    bnHome: "Kreu", bnCal: "Kalendari", bnAppt: "Takimet", bnEcon: "Ekonomia", bnMore: "Më shumë", menuTitle: "Menu",
    bnOrders: "Porositë", bnLeads: "Kërkesa", undo: "Kthe",
    configDesc: "Vendi i vetëm për ta rregulluar biznesin — hapat kryesorë në një vend. Plotësoji një herë; pastaj OptimaBook merret me klientët.",
    cfgStepProfile: "Profili i biznesit", cfgStepProfileD: "Emri, adresa, kontakti, monedha, përshkrimi.",
    cfgStepOffer: "Çfarë ofron", cfgStepOfferD: "Shërbimet & produktet — çmim, kohëzgjatje, stok.",
    cfgStepHours: "Orari & pushimet", cfgStepHoursD: "Kur je hapur dhe pushimet gjatë ditës.",
    cfgStepStaff: "Stafi & lokacionet", cfgStepStaffD: "Shto punëtorë që presin klientë paralelisht.",
    cfgStepExp: "Shpenzimet fikse", cfgStepExpD: "Rroga, qira… që AI t'i zbresë nga fitimi.",
    cfgStepChan: "Lidh kanalin", cfgStepChanD: "WhatsApp/Telegram — ku AI u flet klientëve.",
    tabAiDemo: "🤖 Provo AI-në", aiBadge: "Demo · truri lokal", aiBadgeReal: "🟢 AI real (Gemini) · provë e sigurt", aiSend: "Dërgo",
    aiDemoDesc: "Provo recepsionistin tënd AI — përgjigjet me të dhënat reale të biznesit (çmime, orar, shërbime, rezervime). Kështu do t'u flasë klientëve 24/7.",
    aiPlaceholder: "Shkruaj si klient… p.sh. 'Sa kushton qethja?'",
    aiGreet: "Përshëndetje! 👋 Mirë se vjen te {x}. Si mund të të ndihmoj — çmime, orar, shërbime apo një rezervim?",
    aiChipOffer: "Çfarë ofroni?", aiChipHours: "Cili është orari?", aiChipBook: "Dua të rezervoj", aiChipPrice: "Sa kushton…?",
    aiAnsOfferHead: "Ja çfarë ofrojmë:", aiAnsPriceList: "Disa nga çmimet tona:",
    aiAnsNoItems: "Ende s'kemi shtuar artikuj. (Shtoji te 📦 Çfarë ofroj që AI t'u përgjigjet klientëve.)",
    aiAnsHoursHead: "Orari ynë:", aiAnsClosed: "Mbyllur", aiAnsNoHours: "Orari s'është vendosur ende. (Vendose te 🏢 Profili & orari.)",
    aiAnsLoc: "Na gjen te: {x} 📍", aiAnsNoLoc: "Adresa s'është vendosur ende.",
    aiAnsNoContact: "Kontakti s'është vendosur ende.",
    aiAnsBook: "Me kënaqësi! 😊 Për cilën ditë dhe orë e dëshiron? Ma thuaj dhe ta rezervoj.",
    aiAnsBookItem: "Me kënaqësi! 😊 Për '{x}' — për cilën ditë dhe orë e dëshiron?",
    aiAnsThanks: "S'ka përse! Të presim për një vizitë. 😊", aiWholesale: "shumicë",
    aiAnsFallback: "Mund të të ndihmoj me: çmimet, orarin, shërbimet/produktet, vendndodhjen ose një rezervim. Çfarë të duhet?",
    today: "Sot", dayOff: "Ditë pushimi.", free: "I lirë", cont: "↳ vazhdim", blocked: "⛔ Bllokuar",
    confirmed: "konfirmuar", pending: "në pritje",
    addManual: "+ Shto takim manual", emptyAppt: "Asnjë takim ende.",
    bookedAi: "🤖 AI", manual: "✍ manual", confirmedW: "✓ konfirmuar", cancelledW: "anuluar", attendedW: "✓ erdhi", noShowW: "✘ mungoi",
    remind: "🔔 Kujto", confirmBtn: "✓ Konfirmo", cancelBtn: "Anulo", rescheduleBtn: "Ricakto", attendedBtn: "Erdhi", noShowBtn: "Mungoi",
    toastRescheduled: "U ricaktua", toastNoShow: "Shënuar si mungesë", toastAttended: "Shënuar si i ardhur",
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
    setHoursH: "Orari i punës", setAiH: "AI & Vlerësime", breakLbl: "Pushime", clearBreak: "Hiq pushimin", addBreak: "Shto pushim",
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
    obModeLbl: "Si punon biznesi?", obModeAppt: "📅 Bëj takime", obModeInquiry: "🛒 Marr porosi/kërkesa", obModeBoth: "🔀 Të dyja (takime + porosi)",
    tabLeads: "📥 Kërkesa", leadsDesc: "Kërkesat/porositë e klientëve (për biznese pa takime). AI i merr vetë 24/7.",
    emptyLeads: "Asnjë kërkesë ende.", leadNew: "e re", leadContacted: "u kontaktua", markContacted: "Shëno si kontaktuar",
    statActive: "Takime aktive", statRevenue: "Të ardhura të rezervuara",
    statAi: "Rezervuar nga AI", statConfirmed: "Të konfirmuara",
    statThisMonth: "Të ardhura këtë muaj", statVsLast: "vs muaji i kaluar",
    statPeakDay: "Dita më e ngarkuar", statPeakHour: "Ora e pikut",
    statCancelRate: "Norma e anulimeve", statAiShare: "Punon AI për ty",
    statCapacity: "Kapaciteti i mbushur (këtë muaj)", statProfitHour: "Fitim/orë (këtë muaj)", statNoShows: "Mungesa (no-show)",
    todayTitle: "Sot", todayAppts: "takime", todayNext: "TJETRI", todayEmpty: "Asnjë takim sot — AI yt po pret klientë 24/7 ✨",
    greetMorning: "Mirëmëngjes", greetAfternoon: "Mirëdita", greetEvening: "Mirëmbrëma", swipeHint: "← rrëshqit për veprime",
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
    qsTitle: "Fillimi i shpejtë", qsSub: "Pak hapa dhe AI yt është gati të presë klientë.",
    qsDoneTitle: "Gati! 🎉", qsDoneSub: "AI yt po pret klientë 24/7. Mund ta mbyllësh këtë.",
    qsSvc: "Shto shërbimet e tua", qsHrs: "Vendos orarin e punës",
    qsChan: "Lidh kanalin (WhatsApp/Telegram)", qsMsg: "Merr mesazhin e parë të klientit",
    qsDo: "Bëje", qsHow: "Si?", qsEdit: "Ndrysho",
    qsMsgHelp: "Lidh kanalin te Cilësimet, pastaj dërgo një mesazh provë vetë — do ta shohësh këtu të kryer.",
    emptyApptHint: "Sapo një klient të rezervojë (ose shto një manualisht), takimi shfaqet këtu.",
    emptyWaitHint: "Kur një orar është plot, AI i shton klientët këtu dhe i lajmëron kur lirohet.",
    emptyLeadsHint: "Çdo kërkesë/porosi që AI merr nga klientët do të mblidhet këtu.",
    emptyCustomersHint: "AI i ndërton vetë profilet e klientëve nga bisedat — vizita, shpenzime, kanal.",
    emptyActivityHint: "Çdo veprim i AI-së (rezervime, anulime, kujtesa) shfaqet këtu në kohë reale.",
    emptyBlockHint: "Blloko orare kur s'punon (pushime, dreka) që AI të mos rezervojë atëherë.",
    tabCatalog: "📦 Çfarë ofroj", catalogDesc: "Vendi i vetëm për gjithçka që ofron — shërbime & produkte: çmim, kosto, kohëzgjatje, prenotim, stok, njësi dhe çmime sipas sasisë (shumicë/pakicë).",
    addItem: "+ Shto artikull", emptyCatalog: "Ende pa artikuj.", emptyCatalogHint: "Shembull: 'Qethje' → Shërbim, 30 min, çmimi 10. Ose 'Parfum 199ml' → Produkt, çmimi 45, çmime shumice: nga 2 → 40, nga 100 → 12.",
    itemNew: "Artikull i ri", itemEdit: "Ndrysho artikullin", itemName: "Emri", itemNamePh: "p.sh. Parfum 'Tobako Mix'", itemKind: "Lloji",
    itemDur: "Kohëzgjatja", itemDurUnit: "Njësia e kohës", bookableLbl: "📅 Prenotohet me kalendar",
    itemDesc: "Përshkrimi (detaje për klientin & AI-në)", itemDescPh: "p.sh. 199 ml · erë e fortë · mix kanellë–limon–tobako",
    kindService: "Shërbim", kindProduct: "Produkt / mall", itemPrice: "Çmimi për 1 (bazë)", itemUnit: "Njësia", itemUnitPh: "copë, shishe, kg, m…",
    itemTrack: "Ndiq stokun", itemStock: "Sasia në stok", itemSku: "Kodi (SKU, opsional)",
    itemTiers: "Çmime sipas sasisë (shumicë) — opsionale", tiersHint: "Shkruaj nga sa copë dhe çmimin. P.sh. nga 2 → 40, nga 100 → 12. Aplikohet vetë sipas sasisë.",
    addTier: "+ Shkallë çmimi", tierQty: "Nga sa copë", tierPrice: "Çmimi për copë", stockLbl: "Stok", hasTiers: "💹 shumicë",
    secBasics: "📝 Bazat", secTime: "⏱ Koha & prenotimi", secPricing: "💶 Çmimi", secStock: "📦 Stoku & kodi",
    itemAddons: "➕ Shtesa (montim, postë, garanci…)", addAddon: "+ Shto shtesë", addonNamePh: "p.sh. Montim, Postë, Garanci…", addonRequired: "E detyrueshme",
    addonsHint: "Gjëra që shiten BASHKË me këtë artikull. Secila 'e detyrueshme' (shtohet vetë) ose 'opsionale' (klienti zgjedh). E përdor kush i duhet, si çmimet me shumicë.",
    addonReq: "e detyrueshme", addonOpt: "opsionale", addonOne: "shtesë", addonMany: "shtesa", addonsTitle: "Shto me të:", itemAddonsShort: "Shtesa",
    customizeFields: "⚙ Përshtat fushat për këtë artikull", customizeHint: "Hiq ato që s'i duhen pikërisht këtij artikulli (p.sh. një shërbim s'ka stok). Ndikon vetëm këtë artikull.",
    errGeneric: "Diçka shkoi keq. Provo sërish.", itemDescTitle: "📝 Përshkrimi",
    infoDesc: "Detaje që i shfaqen klientit dhe i përdor AI-ja për t'iu përgjigjur pyetjeve (p.sh. përbërësit, madhësia, ngjyra).",
    infoTime: "Sa zgjat shërbimi dhe a zë një orar në kalendar. Vetëm për shërbime.",
    infoBook: "Nëse aktiv, klientët e rezervojnë vetë në një orar të lirë. Fike për gjëra që s'kanë orar.",
    infoUnit: "Si matet/shitet (copë, kg, litër, shishe…). Shfaqet pranë çmimit.",
    infoStock: "Ndjek sasinë në magazinë; AI lajmëron kur po mbaron. Lëre fikur për shërbime.",
    infoSku: "Kod i brendshëm i artikullit për ta gjetur shpejt (barkod/referencë). Opsional.",
    infoTiers: "Çmim më i lirë kur blihet shumë. P.sh. nga 10 copë → 8€. Zbatohet vetë sipas sasisë.",
    infoAddons: "Shtesa që shiten bashkë (montim, postë, garanci). 'E detyrueshme' shtohet vetë; 'opsionale' e zgjedh klienti.",
    commerceLbl: "🛒 Tregti (produkte, porosi, raporte) & monedha", commerceOnLbl: "Aktivizo katalogun, porositë & raportet",
    delete: "Fshi", confirmDelete: "Ta fshij këtë? S'kthehet mbrapsht.",
    tabGeneral: "🏢 Profili & orari", generalDesc: "Info-ja e kompanisë tënde + orari — plotësoje këtu, pastaj kliko Ruaj. (Shërbimet & produktet i menaxhon te 📦 Çfarë ofroj.)", phoneLbl: "Telefoni / kontakti",
    genName: "Emri i biznesit", genAddr: "Adresa / Lokacioni", emailLbl: "Email", websiteLbl: "Website", instaLbl: "Instagram", cityLbl: "Qyteti",
    genMode: "Mënyra e biznesit", genCurrency: "Monedha", aboutLbl: "Përshkrimi i biznesit (çfarë ofron — e përdor edhe AI)",
    secIdentity: "👤 Identiteti & kontakti", secConfig: "⚙️ Konfigurimi", secDesc: "📝 Përshkrimi",
    aboutPh: "P.sh. Berber në Shkodër — qethje, rruajtje, ngjyrosje. Hapur 9:00–19:00.", saveAllBtn: "💾 Ruaj gjithçka",
    tabOrders: "🧾 Porositë", tabReports: "💰 Ekonomia",
    ordersDesc: "Porositë/shitjet e tua — kush, çfarë, sa, çmimi, statusi dhe pagesa. Edhe porosi që zgjasin muaj (me ETA).",
    addOrder: "+ Porosi e re", filterOpen: "Aktive", filterAll: "Të gjitha",
    stNew: "E re", stConfirmed: "Konfirmuar", stInProgress: "Në punë", stShipped: "Nisur", stDelivered: "Dorëzuar", stCompleted: "Përfunduar", stCancelled: "Anuluar",
    orderNew: "Porosi e re", orderEdit: "Ndrysho porosinë", orderCustomer: "Klienti", orderContact: "Kontakti (tel/email)",
    orderType: "Lloji i shitjes", typeRetail: "Pakicë", typeWholesale: "Shumicë",
    orderItems: "Artikujt", addLine: "+ Artikull", olPick: "Zgjedh artikull…",
    subtotal: "Nëntotali", discount: "Zbritje", total: "Totali",
    orderStatus: "Statusi", orderDue: "Afati/ETA (opsional)", orderPaid: "Pagesa", paidUnpaid: "E papaguar", paidPartial: "Pjesërisht", paidPaid: "E paguar",
    orderAmountPaid: "Shuma e paguar", orderNotes: "Shënime",
    emptyOrders: "Ende pa porosi.", emptyOrdersHint: "Krijo një porosi ose lëre AI-në ta marrë vetë — do shfaqet këtu me status e total.",
    orderNeedItem: "Shto të paktën një artikull.", noItems: "(pa artikuj)", noName: "Pa emër", etaShort: "ETA",
    reportsDesc: "Analiza ekonomike e plotë: të ardhura, fitim, pikë ekuilibri, kapacitet, klientë — sipas periudhës.",
    rep_today: "Sot", rep_week: "7 ditë", rep_month: "Këtë muaj", rep_lastMonth: "Muaji i kaluar", rep_year: "Këtë vit", rep_custom: "Periudhë", apply: "Apliko",
    repNoData: "Pa shitje në këtë periudhë.", repNoDataHint: "Kur të regjistrosh porosi në këtë periudhë, raporti shfaqet këtu.",
    repRevenue: "Të ardhura", repOrders: "Porosi", repUnits: "Njësi të shitura",
    repPaid: "Të arkëtuara", repOutstanding: "Për t'u arkëtuar", repRetail: "Pakicë", repWholesale: "Shumicë",
    repTopProducts: "Më të shiturat", repTopCustomers: "Klientët kryesorë",
    insTitle: "AI Ekonomisti — çfarë të bësh tani", insGo: "Shko",
    insUnpaidT: "Para për t'u arkëtuar", insUnpaidM: "{a} të papaguara në {n} porosi. Dërgo kujtesë pagese.",
    insStockT: "Stok i ulët", insStockM: "Po mbaron: {items}. Rimbush para se të shitet.",
    insChurnT: "Klientë që po ikin", insChurnM: "{n} klientë s'janë kthyer prej 45+ ditësh. Shkruaju një ofertë kthimi.",
    insCancelT: "Anulime të larta", insCancelM: "{p}% e takimeve anulohen. Ndiz kujtesat / kërko depozitë.",
    insTopT: "Më fitimprurësi", insTopM: "{name} të sjell më shumë ({a}). Veçoje ose bëj paketë.",
    insChannelT: "Lidh një kanal", insChannelM: "Lidh WhatsApp/Telegram që AI t'u përgjigjet klientëve 24/7.",
    insPubT: "Ndaj faqen publike", insPubM: "Vendos linkun e faqes në bio/WhatsApp — klientët rezervojnë vetë.",
    draftBtn: "Shkruaj", draftTitle: "Mesazh i gatshëm", draftHint: "Kopjoje dhe dërgoje klientit në WhatsApp/Telegram", draftCopy: "📋 Kopjo",
    winbackMsg: "Përshëndetje! 👋 Ka kohë që s'ju kemi parë te {biz}. Kemi një ofertë të veçantë për ju këtë javë — na shkruani për ta rezervuar! 🙌",
    paymentMsg: "Përshëndetje! Ju kujtojmë me dashamirësi se keni një pagesë në pritje te {biz}. Faleminderit shumë! 🙏",
    addBiz: "+ Biznes", obBack: "← Kthehu",
    setFieldsH: "🧩 Fushat e katalogut (fik ato që s'të duhen)", fieldsDesc: "Çdo gjë është ndezur si parazgjedhje. Fik çfarë s'të duhet — paneli bëhet vetëm i yti.",
    cfgDescLbl: "Përshkrimi", cfgUnitLbl: "Njësia", cfgStockLbl: "Stoku", cfgSkuLbl: "Kodi (SKU)", cfgTiersLbl: "Çmime shumice",
    catalogPointerTxt: "Produktet & shërbimet me përshkrim, çmim, stok dhe çmime shumice menaxhohen te skeda 📦 Catalog lart.", goCatalogBtn: "📦 Hap Katalogun",
    bookableLbl: "📅 Prenotohet me kalendar", svcDesc: "Shto çdo shërbim ose produkt — me lloj, përshkrim, çmim dhe prenotim opsional.",
    itemCost: "Kosto (për ty)", profitOnLbl: "💰 Llogarit fitimin & marzhet (kërkon koston)", fixedLbl: "Shpenzime mujore fikse (qira, rroga…) — opsionale",
    fixedHint: "Shtoji një nga një: rroga e secilit punëtor, qira, drita, interneti… emërtoji si të duash. AI ua zbret nga fitimi.",
    addExpense: "Shto shpenzim", expNamePh: "p.sh. Rroga – Ana, Qira, Drita…", expTotal: "Gjithsej:", perMonth: "muaj", fixedDefaultName: "Shpenzim fiks",
    repCogs: "Kosto e mallit", repGross: "Fitim bruto", repMargin: "Marzhi", repNet: "Fitim neto", repNetHint: "(pas shpenzimeve fikse)",
    repBreakeven: "Pikë ekuilibri", repBeOk: "✓ e kalove", repBeUnder: "ende s'e ke mbuluar", repProfitOrder: "Fitim/porosi (mes.)",
    repCustEcon: "Ekonomia e klientit", repUniqCust: "Klientë unikë", repAvgCust: "Të ardhura/klient (mes.)", repRepeatRate: "Klientë që kthehen",
    repWhatIf: "Simulo çmimin", repWhatIfHint: "Po të ndryshoja çmimet, sa do bëhej fitimi? (duke supozuar të njëjtën sasi)", repWhatIfRev: "Të ardhura",
    repCapacity: "Kapaciteti", repCapFilled: "I mbushur", repBookedHours: "Orë të zëna", repProfitHour: "Fitim/orë",
    manRepeat: "Përsërit", repNone: "Pa përsëritje", repWeekly: "Çdo javë", repBiweekly: "Çdo 2 javë", repMonthly: "Çdo muaj",
    manTimes: "Sa herë", recurDone: "✅ U krijuan {n} takime",
    setPubH: "🌐 Faqe vetë-shërbimi (OPSIONALE)", pubDesc: "S'të duhet detyrimisht. Klientët thjesht të shkruajnë normalisht në WhatsApp/Instagram/Telegram dhe AI u përgjigjet aty. Ky link është vetëm një shtesë — nëse do, vendose në bio që klientët të rezervojnë edhe vetë (si Calendly).",
    copyLink: "Kopjo", openLink: "Hap ↗", copied: "✅ U kopjua",
    teamH: "👥 Ekipi (qasja për punonjësit)", teamDesc: "Shto punonjës me email. Kur regjistrohen me atë email te OptimaBook, hyjnë në KËTË biznes. Pa email-e — thjesht thuaju email-in.",
    teamEmailPh: "email i punonjësit", roleStaff: "Staf", roleManager: "Manaxher", addTeamBtn: "+ Shto",
    teamEmpty: "Ende pa anëtarë ekipi.", teamEmptyHint: "Vetëm ti (pronari) ke qasje tani. Shto punonjës që ta menaxhojnë biznesin bashkë.",
    dangerH: "⚠️ Zona e rrezikut", dangerDesc: "Fshirja heq përgjithmonë biznesin dhe të gjitha të dhënat e tij (shërbime, takime, porosi, klientë). S'kthehet mbrapsht.",
    deleteBiz: "🗑 Fshi këtë biznes", delBizTitle: "🗑 Fshi biznesin", delBizGo: "🗑 Fshi përgjithmonë",
    delBizMsg: "Për të konfirmuar, shkruaj saktësisht emrin e biznesit:", delBizHuman: "Nuk jam robot — e konfirmoj që dua ta fshij", toastDeleted: "🗑 Biznesi u fshi",
    printDoc: "🧾 Faturë / Ofertë", invInvoice: "FATURË", invQuote: "OFERTË", invNo: "Nr.", invDate: "Data",
    invFrom: "Nga", invTo: "Për", invItem: "Artikulli", invQty: "Sasia", invPrice: "Çmimi", invLineTotal: "Totali",
    invSubtotal: "Nëntotali", invDiscount: "Zbritje", invTotal: "TOTALI", invPaid: "Paguar", invDue: "Mbetet",
    invETA: "Afati i dorëzimit", invNotes: "Shënime", invThanks: "Faleminderit!",
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
    obServices: "Services / Products", addService: "+ Add service",
    unitMin: "min", unitHour: "hours", unitDay: "days", unitWeek: "weeks", unitMonth: "months", unitYear: "years", unitNone: "— none",
    obHours: "Working hours", closed: "closed",
    obFinish: "Finish — I'm ready ✓", svcNamePh: "Service name",
    logout: "Sign out", panelPrefix: "Panel — ",
    tabCal: "📅 Calendar", tabAppt: "📋 Appointments", tabBlock: "⛔ Blocks", tabStat: "🏠 Overview",
    grpHome: "Home", grpWork: "Work", grpBiz: "Business", grpOther: "More",
    grpDaily: "Use daily", grpSetup: "Set up once", tabConfig: "🚀 Setup", optional: "optional",
    bnHome: "Home", bnCal: "Calendar", bnAppt: "Bookings", bnEcon: "Economy", bnMore: "More", menuTitle: "Menu",
    bnOrders: "Orders", bnLeads: "Requests", undo: "Undo",
    configDesc: "The single place to set up your business — the key steps in one spot. Fill it once; then OptimaBook handles customers.",
    cfgStepProfile: "Business profile", cfgStepProfileD: "Name, address, contact, currency, description.",
    cfgStepOffer: "What you offer", cfgStepOfferD: "Services & products — price, duration, stock.",
    cfgStepHours: "Hours & breaks", cfgStepHoursD: "When you're open and breaks during the day.",
    cfgStepStaff: "Staff & locations", cfgStepStaffD: "Add workers who serve customers in parallel.",
    cfgStepExp: "Fixed expenses", cfgStepExpD: "Salaries, rent… so the AI subtracts them from profit.",
    cfgStepChan: "Connect channel", cfgStepChanD: "WhatsApp/Telegram — where AI talks to customers.",
    tabAiDemo: "🤖 Try the AI", aiBadge: "Demo · local brain", aiBadgeReal: "🟢 Real AI (Gemini) · safe preview", aiSend: "Send",
    aiDemoDesc: "Try your AI receptionist — it answers with your real business data (prices, hours, services, bookings). This is how it will talk to customers 24/7.",
    aiPlaceholder: "Type like a customer… e.g. 'How much is a haircut?'",
    aiGreet: "Hi! 👋 Welcome to {x}. How can I help — prices, hours, services or a booking?",
    aiChipOffer: "What do you offer?", aiChipHours: "What are your hours?", aiChipBook: "I'd like to book", aiChipPrice: "How much is…?",
    aiAnsOfferHead: "Here's what we offer:", aiAnsPriceList: "Some of our prices:",
    aiAnsNoItems: "No items added yet. (Add them in 📦 What I offer so the AI can answer customers.)",
    aiAnsHoursHead: "Our hours:", aiAnsClosed: "Closed", aiAnsNoHours: "Hours not set yet. (Set them in 🏢 Profile & hours.)",
    aiAnsLoc: "Find us at: {x} 📍", aiAnsNoLoc: "Address not set yet.",
    aiAnsNoContact: "Contact not set yet.",
    aiAnsBook: "Happy to! 😊 What day and time would you like? Tell me and I'll book it.",
    aiAnsBookItem: "Happy to! 😊 For '{x}' — what day and time would you like?",
    aiAnsThanks: "You're welcome! See you soon. 😊", aiWholesale: "wholesale",
    aiAnsFallback: "I can help with: prices, hours, services/products, location or a booking. What do you need?",
    today: "Today", dayOff: "Day off.", free: "Free", cont: "↳ continues", blocked: "⛔ Blocked",
    confirmed: "confirmed", pending: "pending",
    addManual: "+ Add manual appointment", emptyAppt: "No appointments yet.",
    bookedAi: "🤖 AI", manual: "✍ manual", confirmedW: "✓ confirmed", cancelledW: "cancelled", attendedW: "✓ attended", noShowW: "✘ no-show",
    remind: "🔔 Remind", confirmBtn: "✓ Confirm", cancelBtn: "Cancel", rescheduleBtn: "Reschedule", attendedBtn: "Came", noShowBtn: "No-show",
    toastRescheduled: "Rescheduled", toastNoShow: "Marked as no-show", toastAttended: "Marked as attended",
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
    setHoursH: "Working hours", setAiH: "AI & Reviews", breakLbl: "Breaks", clearBreak: "Remove break", addBreak: "Add break",
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
    obModeLbl: "How does your business work?", obModeAppt: "📅 I take appointments", obModeInquiry: "🛒 I take orders/requests", obModeBoth: "🔀 Both (appointments + orders)",
    tabLeads: "📥 Requests", leadsDesc: "Customer requests/orders (for businesses without appointments). The AI captures them 24/7.",
    emptyLeads: "No requests yet.", leadNew: "new", leadContacted: "contacted", markContacted: "Mark contacted",
    statActive: "Active appointments", statRevenue: "Booked revenue",
    statAi: "Booked by AI", statConfirmed: "Confirmed",
    statThisMonth: "Revenue this month", statVsLast: "vs last month",
    statPeakDay: "Busiest day", statPeakHour: "Peak hour",
    statCancelRate: "Cancellation rate", statAiShare: "AI works for you",
    statCapacity: "Capacity filled (this month)", statProfitHour: "Profit/hour (this month)", statNoShows: "No-shows",
    todayTitle: "Today", todayAppts: "bookings", todayNext: "NEXT", todayEmpty: "No bookings today — your AI is taking customers 24/7 ✨",
    greetMorning: "Good morning", greetAfternoon: "Good afternoon", greetEvening: "Good evening", swipeHint: "← swipe for actions",
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
    qsTitle: "Quick start", qsSub: "A few steps and your AI is ready to welcome customers.",
    qsDoneTitle: "All set! 🎉", qsDoneSub: "Your AI is serving customers 24/7. You can close this.",
    qsSvc: "Add your services", qsHrs: "Set your working hours",
    qsChan: "Connect a channel (WhatsApp/Telegram)", qsMsg: "Get your first customer message",
    qsDo: "Do it", qsHow: "How?", qsEdit: "Edit",
    qsMsgHelp: "Connect a channel in Settings, then send a test message yourself — you'll see this checked off.",
    emptyApptHint: "As soon as a customer books (or you add one manually), the appointment shows up here.",
    emptyWaitHint: "When a slot is full, the AI adds customers here and notifies them when it frees up.",
    emptyLeadsHint: "Every request/order the AI receives from customers will be collected here.",
    emptyCustomersHint: "The AI builds customer profiles automatically from chats — visits, spend, channel.",
    emptyActivityHint: "Every AI action (bookings, cancellations, reminders) appears here in real time.",
    emptyBlockHint: "Block off times when you're closed (holidays, lunch) so the AI won't book then.",
    tabCatalog: "📦 What I offer", catalogDesc: "The single place for everything you offer — services & products: price, cost, duration, booking, stock, unit and quantity pricing (wholesale/retail).",
    addItem: "+ Add item", emptyCatalog: "No items yet.", emptyCatalogHint: "Example: 'Haircut' → Service, 30 min, price 10. Or 'Perfume 199ml' → Product, price 45, wholesale tiers: from 2 → 40, from 100 → 12.",
    itemNew: "New item", itemEdit: "Edit item", itemName: "Name", itemNamePh: "e.g. Perfume 'Tobacco Mix'", itemKind: "Type",
    itemDur: "Duration", itemDurUnit: "Time unit", bookableLbl: "📅 Bookable on calendar",
    itemDesc: "Description (details for customer & AI)", itemDescPh: "e.g. 199 ml · strong scent · cinnamon–lemon–tobacco mix",
    kindService: "Service", kindProduct: "Product / goods", itemPrice: "Price for 1 (base)", itemUnit: "Unit", itemUnitPh: "pc, bottle, kg, m…",
    itemTrack: "Track stock", itemStock: "Stock quantity", itemSku: "Code (SKU, optional)",
    itemTiers: "Quantity pricing (wholesale) — optional", tiersHint: "Enter from how many and the price. E.g. from 2 → 40, from 100 → 12. Applied automatically by quantity.",
    addTier: "+ Price tier", tierQty: "From qty", tierPrice: "Price each", stockLbl: "Stock", hasTiers: "💹 wholesale",
    secBasics: "📝 Basics", secTime: "⏱ Time & booking", secPricing: "💶 Price", secStock: "📦 Stock & code",
    itemAddons: "➕ Add-ons (installation, shipping, warranty…)", addAddon: "+ Add add-on", addonNamePh: "e.g. Installation, Shipping, Warranty…", addonRequired: "Required",
    addonsHint: "Things sold TOGETHER with this item. Each 'required' (added automatically) or 'optional' (customer chooses). Use it if you need it, like wholesale pricing.",
    addonReq: "required", addonOpt: "optional", addonOne: "add-on", addonMany: "add-ons", addonsTitle: "Add with it:", itemAddonsShort: "Add-ons",
    customizeFields: "⚙ Customize fields for this item", customizeHint: "Turn off what this specific item doesn't need (e.g. a service has no stock). Affects only this item.",
    errGeneric: "Something went wrong. Try again.", itemDescTitle: "📝 Description",
    infoDesc: "Details shown to the customer and used by the AI to answer questions (e.g. ingredients, size, color).",
    infoTime: "How long the service takes and whether it books a calendar slot. Services only.",
    infoBook: "If on, customers can self-book a free slot. Turn off for things without a schedule.",
    infoUnit: "How it's measured/sold (pc, kg, litre, bottle…). Shown next to the price.",
    infoStock: "Tracks quantity on hand; the AI alerts when low. Leave off for services.",
    infoSku: "Internal item code to find it fast (barcode/reference). Optional.",
    infoTiers: "Cheaper price when buying a lot. E.g. from 10 pcs → 8€. Applied automatically by quantity.",
    infoAddons: "Extras sold together (installation, shipping, warranty). 'Required' is auto-added; 'optional' the customer chooses.",
    commerceLbl: "🛒 Commerce (products, orders, reports) & currency", commerceOnLbl: "Enable catalog, orders & reports",
    delete: "Delete", confirmDelete: "Delete this? This cannot be undone.",
    tabGeneral: "🏢 Profile & hours", generalDesc: "Your company info + hours — fill it here, then click Save. (Manage services & products in 📦 What I offer.)", phoneLbl: "Phone / contact",
    genName: "Business name", genAddr: "Address / Location", emailLbl: "Email", websiteLbl: "Website", instaLbl: "Instagram", cityLbl: "City",
    genMode: "Business mode", genCurrency: "Currency", aboutLbl: "Business description (what you offer — used by the AI too)",
    secIdentity: "👤 Identity & contact", secConfig: "⚙️ Configuration", secDesc: "📝 Description",
    aboutPh: "E.g. Barber in Shkodër — haircut, shave, coloring. Open 9:00–19:00.", saveAllBtn: "💾 Save all",
    tabOrders: "🧾 Orders", tabReports: "💰 Economy",
    ordersDesc: "Your orders/sales — who, what, how many, price, status and payment. Even orders that take months (with ETA).",
    addOrder: "+ New order", filterOpen: "Active", filterAll: "All",
    stNew: "New", stConfirmed: "Confirmed", stInProgress: "In progress", stShipped: "Shipped", stDelivered: "Delivered", stCompleted: "Completed", stCancelled: "Cancelled",
    orderNew: "New order", orderEdit: "Edit order", orderCustomer: "Customer", orderContact: "Contact (phone/email)",
    orderType: "Sale type", typeRetail: "Retail", typeWholesale: "Wholesale",
    orderItems: "Items", addLine: "+ Item", olPick: "Pick item…",
    subtotal: "Subtotal", discount: "Discount", total: "Total",
    orderStatus: "Status", orderDue: "Due/ETA (optional)", orderPaid: "Payment", paidUnpaid: "Unpaid", paidPartial: "Partial", paidPaid: "Paid",
    orderAmountPaid: "Amount paid", orderNotes: "Notes",
    emptyOrders: "No orders yet.", emptyOrdersHint: "Create an order or let the AI capture it — it'll appear here with status and total.",
    orderNeedItem: "Add at least one item.", noItems: "(no items)", noName: "No name", etaShort: "ETA",
    reportsDesc: "Full economic analysis: revenue, profit, break-even, capacity, customers — for the period you pick.",
    rep_today: "Today", rep_week: "7 days", rep_month: "This month", rep_lastMonth: "Last month", rep_year: "This year", rep_custom: "Custom", apply: "Apply",
    repNoData: "No sales in this period.", repNoDataHint: "Once you record orders in this period, the report shows up here.",
    repRevenue: "Revenue", repOrders: "Orders", repUnits: "Units sold",
    repPaid: "Collected", repOutstanding: "Outstanding", repRetail: "Retail", repWholesale: "Wholesale",
    repTopProducts: "Best sellers", repTopCustomers: "Top customers",
    insTitle: "AI Economist — what to do now", insGo: "Go",
    insUnpaidT: "Money to collect", insUnpaidM: "{a} unpaid across {n} orders. Send a payment reminder.",
    insStockT: "Low stock", insStockM: "Running out: {items}. Restock before it sells out.",
    insChurnT: "Customers slipping away", insChurnM: "{n} customers haven't returned in 45+ days. Send a win-back offer.",
    insCancelT: "High cancellations", insCancelM: "{p}% of appointments cancel. Turn on reminders / ask a deposit.",
    insTopT: "Top earner", insTopM: "{name} earns you the most ({a}). Feature it or make a package.",
    insChannelT: "Connect a channel", insChannelM: "Connect WhatsApp/Telegram so the AI answers customers 24/7.",
    insPubT: "Share your public page", insPubM: "Put your page link in bio/WhatsApp — customers book themselves.",
    draftBtn: "Draft", draftTitle: "Ready-to-send message", draftHint: "Copy and send it to the customer on WhatsApp/Telegram", draftCopy: "📋 Copy",
    winbackMsg: "Hi! 👋 We haven't seen you at {biz} in a while. We've got a special offer for you this week — message us to book! 🙌",
    paymentMsg: "Hi! A friendly reminder that you have a pending payment at {biz}. Thank you so much! 🙏",
    addBiz: "+ Business", obBack: "← Back",
    setFieldsH: "🧩 Catalog fields (turn off what you don't need)", fieldsDesc: "Everything is on by default. Turn off what you don't need — the panel becomes truly yours.",
    cfgDescLbl: "Description", cfgUnitLbl: "Unit", cfgStockLbl: "Stock", cfgSkuLbl: "Code (SKU)", cfgTiersLbl: "Wholesale pricing",
    catalogPointerTxt: "Products & services with description, price, stock and wholesale pricing are managed in the 📦 Catalog tab above.", goCatalogBtn: "📦 Open Catalog",
    bookableLbl: "📅 Bookable on calendar", svcDesc: "Add any service or product — with type, description, price and optional booking.",
    itemCost: "Cost (your cost)", profitOnLbl: "💰 Calculate profit & margins (needs cost)", fixedLbl: "Fixed monthly expenses (rent, salaries…) — optional",
    fixedHint: "Add them one by one: each worker's salary, rent, electricity, internet… name them however you like. The AI subtracts them from profit.",
    addExpense: "Add expense", expNamePh: "e.g. Salary – Ana, Rent, Electricity…", expTotal: "Total:", perMonth: "month", fixedDefaultName: "Fixed expense",
    repCogs: "Cost of goods", repGross: "Gross profit", repMargin: "Margin", repNet: "Net profit", repNetHint: "(after fixed expenses)",
    repBreakeven: "Break-even", repBeOk: "✓ passed", repBeUnder: "not covered yet", repProfitOrder: "Profit/order (avg)",
    repCustEcon: "Customer economics", repUniqCust: "Unique customers", repAvgCust: "Revenue/customer (avg)", repRepeatRate: "Returning customers",
    repWhatIf: "Price simulator", repWhatIfHint: "If I changed prices, what would profit be? (assuming the same volume)", repWhatIfRev: "Revenue",
    repCapacity: "Capacity", repCapFilled: "Filled", repBookedHours: "Booked hours", repProfitHour: "Profit/hour",
    manRepeat: "Repeat", repNone: "No repeat", repWeekly: "Weekly", repBiweekly: "Every 2 weeks", repMonthly: "Monthly",
    manTimes: "How many", recurDone: "✅ Created {n} appointments",
    setPubH: "🌐 Self-service page (OPTIONAL)", pubDesc: "Not required. Customers just message you normally on WhatsApp/Instagram/Telegram and the AI replies there. This link is only an extra — if you want, put it in your bio so customers can also book themselves (like Calendly).",
    copyLink: "Copy", openLink: "Open ↗", copied: "✅ Copied",
    teamH: "👥 Team (employee access)", teamDesc: "Add employees by email. When they sign up with that email on OptimaBook, they get into THIS business. No emails sent — just tell them the address.",
    teamEmailPh: "employee email", roleStaff: "Staff", roleManager: "Manager", addTeamBtn: "+ Add",
    teamEmpty: "No team members yet.", teamEmptyHint: "Only you (owner) have access now. Add employees to run the business together.",
    dangerH: "⚠️ Danger zone", dangerDesc: "Deleting permanently removes the business and all its data (services, appointments, orders, customers). This cannot be undone.",
    deleteBiz: "🗑 Delete this business", delBizTitle: "🗑 Delete business", delBizGo: "🗑 Delete permanently",
    delBizMsg: "To confirm, type the business name exactly:", delBizHuman: "I'm not a robot — I confirm I want to delete", toastDeleted: "🗑 Business deleted",
    printDoc: "🧾 Invoice / Quote", invInvoice: "INVOICE", invQuote: "QUOTE", invNo: "No.", invDate: "Date",
    invFrom: "From", invTo: "To", invItem: "Item", invQty: "Qty", invPrice: "Price", invLineTotal: "Total",
    invSubtotal: "Subtotal", invDiscount: "Discount", invTotal: "TOTAL", invPaid: "Paid", invDue: "Outstanding",
    invETA: "Delivery by", invNotes: "Notes", invThanks: "Thank you!",
  },
};
const tr = (k) => T[lang][k];

// Gjendje bosh e pasur (ikonë + titull + ndihmë) — udhëzon pronarin e ri
function emptyHTML(icon, title, hint) {
  return `<div class="empty"><span class="e-ic">${icon}</span><div class="e-title">${esc(title)}</div>` +
    (hint ? `<div class="e-hint">${esc(hint)}</div>` : "") + `</div>`;
}

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
function toast(text, kind, action) {
  const el = $("#toast"); if (!el) return;
  el.innerHTML = "";
  const span = document.createElement("span"); span.textContent = text; el.appendChild(span);
  if (action && action.fn) {
    const b = document.createElement("button"); b.className = "toast-act"; b.textContent = action.label;
    b.onclick = () => { el.classList.remove("show"); haptic(); action.fn(); };
    el.appendChild(b);
  }
  el.classList.toggle("err", kind === "err");
  el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), action ? 5500 : (kind === "err" ? 4200 : 2600));
}
// Haptic — dridhje e lehtë në veprime (ndjesi native, kur pajisja e mbështet)
function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }
// Skeleton — vendoset gjatë ngarkimit (shpejtësi e perceptuar, jo ekran bosh)
function skel(n) { let h = ""; for (let i = 0; i < (n || 3); i++) h += '<div class="skel-row"></div>'; return `<div class="skel">${h}</div>`; }
// Përshëndetje sipas kohës së ditës
function greetWord() { const h = new Date().getHours(); return h < 12 ? tr("greetMorning") : h < 18 ? tr("greetAfternoon") : tr("greetEvening"); }
// Njoftim gabimi i bukur (zëvendëson alert) + log i lehtë për diagnostikë
function errToast(e) {
  const msg = (e && e.message) ? e.message : (typeof e === "string" ? e : tr("errGeneric"));
  logClientError("handled", msg, e);
  toast(msg, "err");
}
// Observability-lite: log gabimesh në console + unazë në localStorage (pa llogari/varësi)
function logClientError(type, msg, err) {
  try {
    console.error("[OptimaBook]", type, msg, err || "");
    const ring = JSON.parse(localStorage.getItem("ob-errlog") || "[]");
    ring.push({ t: new Date().toISOString(), type, msg: String(msg).slice(0, 300), v: (typeof OB_VERSION !== "undefined" ? OB_VERSION : ""), biz: (biz && biz.id) || null });
    while (ring.length > 25) ring.shift();
    localStorage.setItem("ob-errlog", JSON.stringify(ring));
  } catch (_e) {}
}
window.addEventListener("error", (e) => logClientError("window.error", (e && e.message) || "error", e && e.error));
window.addEventListener("unhandledrejection", (e) => logClientError("unhandledrejection", (e && e.reason && e.reason.message) || String(e && e.reason), e && e.reason));
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
let biz = null;            // {id, name, type, address} — biznesi aktiv
let businesses = [];       // të gjitha bizneset e pronarit (multi-business)
let addingBiz = false;     // onboarding po shton një biznes shtesë (jo i pari)
let services = [];         // [{id, name, duration_min, price}]
let hours = {};            // weekday -> {open, close} ose null
let staff = [];            // [{id, name, role, location_id}] — bosh = biznes me një person
let locations = [];        // [{id, name, address}]
let calStaff = null;       // filtri i kalendarit (id stafi) ose null = të gjithë
let calDate = fmtDate(new Date());
let priceTiers = [];       // [{service_id, min_qty, unit_price}] — çmime sipas sasisë
let editingItemId = null;  // artikulli në editim (katalog)
let myUserId = null, myEmail = "";  // përdoruesi aktual (për pronar vs anëtar ekipi)

// Monedha (global) — simboli sipas biznesit
const CUR_SYM = { EUR:"€", USD:"$", GBP:"£", ALL:"L", CHF:"CHF", CAD:"$", AUD:"$", AED:"AED", TRY:"₺", RSD:"din", MKD:"den", RON:"lei", BGN:"лв", SEK:"kr", INR:"₹", JPY:"¥", CNY:"¥" };
function curSym() { return CUR_SYM[(biz && biz.currency) || "EUR"] || ((biz && biz.currency) || "€"); }
function round2(n) { return OB.round2(n); } // logjikë e testuar te core.js
function money(n) { const v = round2(n); const s = curSym(); return s.length === 1 ? `${v}${s}` : `${v} ${s}`; }
// Tregtia është aktive kur pronari e ka ndezur OSE biznesi merr porosi (inquiry) → Katalogu/Porositë/Raportet dalin vetë
function commerceOn() { return !!(biz && (biz.commerce_enabled || biz.mode === "inquiry" || biz.mode === "both")); }

// A shfaqet një fushë e katalogut? (pronari mund të fikë çdo fushë; default = shfaqet)
function showField(key) { return !(biz && biz.config && biz.config[key] === false); }

// A është ndezur moduli i fitimit? (opsional — kërkon kosto)
function profitOn() { return !!(biz && biz.config && biz.config.profitOn); }

// Shpenzimet fikse mujore si LISTË e emërtuar (rroga, qira…). Përputhshmëri me versionin e vjetër (numër i vetëm).
function fixedCostsList() {
  const cfg = (biz && biz.config) || {};
  if (Array.isArray(cfg.fixedCosts)) return cfg.fixedCosts.filter((x) => x && (x.name || Number(x.amount)));
  if (Number(cfg.fixedMonthly)) return [{ name: tr("fixedDefaultName"), amount: Number(cfg.fixedMonthly) }];
  return [];
}
function fixedMonthlyTotal() { return fixedCostsList().reduce((a, x) => a + (Number(x.amount) || 0), 0); }
function addFixedCostRow(name, amount) {
  const list = $("#fixedCostList"); if (!list) return;
  const row = document.createElement("div");
  row.className = "exp-row";
  const n = document.createElement("input");
  n.type = "text"; n.className = "exp-name"; n.maxLength = 40; n.placeholder = tr("expNamePh"); n.value = name || "";
  const a = document.createElement("input");
  a.type = "number"; a.className = "exp-amt"; a.min = 0; a.step = 1; a.placeholder = "0"; a.value = amount != null ? amount : "";
  const sym = document.createElement("span"); sym.className = "exp-cur"; sym.textContent = curSym();
  const del = document.createElement("button");
  del.type = "button"; del.className = "btn-round sm danger"; del.setAttribute("aria-label", tr("delete")); del.innerHTML = "<span>×</span>";
  del.onclick = () => { row.remove(); updateFixedTotal(); };
  a.oninput = updateFixedTotal;
  row.appendChild(n); row.appendChild(a); row.appendChild(sym); row.appendChild(del);
  list.appendChild(row);
}
function updateFixedTotal() {
  const el = $("#fixedCostTotal"); if (!el) return;
  let sum = 0;
  document.querySelectorAll("#fixedCostList .exp-row .exp-amt").forEach((i) => { sum += Number(i.value) || 0; });
  el.textContent = sum > 0 ? tr("expTotal") + " " + money(sum) + "/" + tr("perMonth") : "";
}
function renderFixedCosts() {
  const list = $("#fixedCostList"); if (!list) return;
  list.innerHTML = "";
  fixedCostsList().forEach((x) => addFixedCostRow(x.name, x.amount));
  updateFixedTotal();
}
function collectFixedCosts() {
  const out = [];
  document.querySelectorAll("#fixedCostList .exp-row").forEach((r) => {
    const name = r.querySelector(".exp-name").value.trim();
    const amount = Number(r.querySelector(".exp-amt").value) || 0;
    if (name || amount) out.push({ name: name || tr("fixedDefaultName"), amount });
  });
  return out;
}

// Çmimi/njësi sipas sasisë: zgjedh shkallën më të mirë (min_qty më e madhe <= qty), përndryshe çmimi bazë
function unitPriceFor(item, qty) {
  // logjikë e testuar te core.js (bestUnitPrice)
  return OB.bestUnitPrice(item.price, priceTiers.filter((t) => t.service_id === item.id), qty);
}

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
  try { const { data } = await sb.auth.getUser(); myUserId = data.user ? data.user.id : null; myEmail = data.user ? (data.user.email || "") : ""; } catch (e) {}
  await loadBusiness();
  if (biz) { renderBizSwitch(); showView("app"); await loadAll(); }   // shfaq panelin së pari → s'mbetet kurrë bosh
  else { openOnboard(); showView("onboard"); }
}

async function logout() {
  await sb.auth.signOut();
  biz = null; businesses = []; services = []; hours = {}; addingBiz = false;
  showView("auth");
}

/* =====================================================================
   DATA
   ===================================================================== */
async function loadBusiness() {
  // Të gjitha bizneset e pronarit (multi-business); aktiv = i ruajtur ose i pari
  const { data } = await sb.from("businesses").select("*").order("created_at", { ascending: true });
  businesses = data || [];
  let saved = null;
  try { saved = localStorage.getItem("ob-active-biz"); } catch (e) {}
  biz = businesses.find((b) => b.id === saved) || businesses[0] || null;
}

function setActiveBiz(id) {
  try { localStorage.setItem("ob-active-biz", id); } catch (e) {}
}

// Ndërruesi i biznesit në panel (shfaqet kur ka >1 biznes)
function renderBizSwitch() {
  const sel = $("#bizSwitch");
  if (!sel) return;
  if (businesses.length > 1) {
    sel.hidden = false;
    sel.innerHTML = businesses.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join("");
    if (biz) sel.value = biz.id;
  } else {
    sel.hidden = true;
  }
}

async function switchBusiness(id) {
  if (!id || (biz && id === biz.id)) return;
  const target = businesses.find((b) => b.id === id);
  if (!target) return;
  biz = target;
  setActiveBiz(id);
  // Rivendos gjendjen që s'duhet të kalojë mes bizneseve
  calStaff = null; calDate = fmtDate(new Date());
  $("#bizName").textContent = tr("panelPrefix") + biz.name;
  await loadAll();
}

// Shto një biznes të ri (hap onboarding-un shtesë)
function addNewBusiness() {
  addingBiz = true;
  openOnboard();
  showView("onboard");
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
// Çmimet sipas sasisë — graceful nëse commerce.sql s'është ekzekutuar ende
async function loadTiers() {
  priceTiers = [];
  try {
    const { data } = await sb.from("price_tiers").select("*").eq("business_id", biz.id).order("min_qty");
    priceTiers = data || [];
  } catch (e) { /* tabela mund të mungojë */ }
}

async function loadAll() {
  await Promise.all([loadServices(), loadHours(), loadStaff(), loadLocations(), loadTiers()]);
  $("#bizName").textContent = tr("panelPrefix") + biz.name;
  const ru = $("#reviewUrl"); if (ru) ru.value = biz.review_url || "";
  const an = $("#aiNotes"); if (an) an.value = biz.ai_notes || "";
  const bm = $("#bizMode"); if (bm) bm.value = biz.mode || "appointments";
  setupStaffUI();
  applyModeUI();
  renderSettings();
  await renderAll();
  renderCatalog();
  if (commerceOn()) renderOrders();
  renderConfigHub();
}

/* ---------------- Qendra e konfigurimit (hub i udhëhequr "rregullo një herë") ---------------- */
function renderConfigHub() {
  const hub = $("#cfgHub"); if (!hub || !biz) return;
  const cfg = biz.config || {};
  const apptMode = (biz.mode || "appointments") !== "inquiry";
  const steps = [
    { ic: "🏢", title: tr("cfgStepProfile"), desc: tr("cfgStepProfileD"), done: !!(biz.name && (biz.address || cfg.phone || cfg.city || cfg.email)), tab: "general", el: null, req: true },
    { ic: "📦", title: tr("cfgStepOffer"), desc: tr("cfgStepOfferD"), done: services.length > 0, tab: "catalog", el: null, req: true },
  ];
  if (apptMode) steps.push({ ic: "⏰", title: tr("cfgStepHours"), desc: tr("cfgStepHoursD"), done: Object.values(hours).some((h) => h), tab: "general", el: "setHoursBlock", req: true });
  steps.push({ ic: "👥", title: tr("cfgStepStaff"), desc: tr("cfgStepStaffD"), done: staff.length > 0, tab: "staff", el: null, req: false });
  if (profitOn()) steps.push({ ic: "💰", title: tr("cfgStepExp"), desc: tr("cfgStepExpD"), done: fixedCostsList().length > 0, tab: "general", el: "fixedCostField", req: false });
  steps.push({ ic: "🔗", title: tr("cfgStepChan"), desc: tr("cfgStepChanD"), done: !!biz.telegram_token, tab: "settings", el: "channelBlock", req: true });

  const reqs = steps.filter((s) => s.req);
  const doneN = reqs.filter((s) => s.done).length;
  const bar = $("#cfgBar"); if (bar) bar.style.width = Math.round(doneN / Math.max(1, reqs.length) * 100) + "%";
  hub.innerHTML = "";
  steps.forEach((s) => {
    const card = document.createElement("div");
    card.className = "cfg-card" + (s.done ? " done" : "");
    const tag = s.done ? `<span class="cfg-chk">✓</span>` : (s.req ? "" : `<span class="cfg-opt">${tr("optional")}</span>`);
    const btn = document.createElement("button");
    btn.className = "btn small cfg-go " + (s.done ? "ghost" : "primary");
    btn.textContent = s.done ? tr("qsEdit") : tr("qsDo");
    btn.onclick = () => {
      const t = document.querySelector('.tab[data-tab="' + s.tab + '"]'); if (t) t.click();
      if (s.el) setTimeout(() => { const e = $("#" + s.el); if (e) { e.scrollIntoView({ behavior: "smooth", block: "center" }); e.classList.add("flash"); setTimeout(() => e.classList.remove("flash"), 1200); } }, 90);
    };
    const txt = document.createElement("div"); txt.className = "cfg-txt";
    txt.innerHTML = `<div class="cfg-t">${s.ic} ${esc(s.title)} ${tag}</div><div class="cfg-d">${esc(s.desc)}</div>`;
    card.appendChild(txt); card.appendChild(btn);
    hub.appendChild(card);
  });
}

/* ---------------- Katalogu (produkte/shërbime + stok + çmime sipas sasisë) ---------------- */
function renderCatalog() {
  const list = $("#catalogList");
  if (!list) return;
  if (!services.length) { list.innerHTML = emptyHTML("📦", tr("emptyCatalog"), tr("emptyCatalogHint")); return; }
  list.innerHTML = "";
  services.forEach((s) => {
    const kind = s.kind === "product" ? "product" : "service";
    const tiers = priceTiers.filter((t) => t.service_id === s.id);
    const meta = [`<span class="kind-badge ${kind}">${kind === "product" ? tr("kindProduct") : tr("kindService")}</span>`];
    if (kind === "service") {
      if (s.duration_value != null && s.duration_unit) meta.push(`⏱ ${plainNum(s.duration_value)} ${tr(UNIT_KEY[s.duration_unit] || "unitMin")}`);
      else if (s.duration_min) meta.push(`⏱ ${plainNum(s.duration_min)} ${tr("unitMin")}`);
      if (s.bookable !== false) meta.push("📅");
    }
    if (itemShowsField(s, "unit") && s.unit_label) meta.push(esc(s.unit_label));
    if (itemShowsField(s, "stock") && s.track_stock) {
      const low = Number(s.stock) <= 3;
      meta.push(`<span class="stock-badge ${low ? "low" : ""}">${tr("stockLbl")}: ${s.stock != null ? s.stock : 0}</span>`);
    }
    if (itemShowsField(s, "tiers") && tiers.length) meta.push(`💹 ${tiers.map((t) => `${plainNum(t.min_qty)}+ → ${money(t.unit_price)}`).join(", ")}`);
    if (itemShowsField(s, "addons") && Array.isArray(s.addons) && s.addons.length) meta.push(`➕ ${s.addons.length} ${tr(s.addons.length === 1 ? "addonOne" : "addonMany")}`);
    const desc = (itemShowsField(s, "desc") && s.description) ? `<div class="cat-desc">${esc(s.description)}</div>` : "";
    const item = document.createElement("div");
    item.className = "cat-item";
    item.innerHTML = `<span class="grow"><div class="cat-name">${esc(s.name)}</div>${desc}<div class="cat-meta">${meta.join(" ")}</div></span><span class="cat-price">${money(s.price)}</span>`;
    item.onclick = () => openItem(s);
    list.appendChild(item);
  });
}

/* ---------------- Recepsionisti AI (demo · truri lokal me të dhënat reale) ---------------- */
// Normalizon tekstin shqip/anglisht për krahasim (ë→e, ç→c, pa shenja)
function aiNorm(s) {
  return String(s || "").toLowerCase()
    .replace(/[ëé]/g, "e").replace(/ç/g, "c").replace(/[áàâ]/g, "a").replace(/[íì]/g, "i").replace(/[óò]/g, "o").replace(/[úù]/g, "u")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function tr2(k, x) { return tr(k).replace("{x}", x); }
const AI_KW = {
  price: ["sa kushton", "kushton", "cmim", "price", "cost", "how much", "sa eshte", "vlera", "sa ben"],
  offer: ["cfare ofro", "cfare keni", "cfare beni", "sherbim", "produkt", "menu", "lista", "what do you offer", "services", "products", "offer", "what do you have"],
  hours: ["orar", "hapur", "mbyllur", "kur jeni", "kur hapeni", "open", "close", "hours", "schedule", "a punoni", "kur punoni"],
  loc: ["ku jeni", "ku ndodh", "adres", "ku je", "where", "address", "location", "ku gjend", "ku ju gjej"],
  contact: ["telefon", "kontakt", "numri", "instagram", "email", "phone", "contact", "whatsapp"],
  book: ["rezerv", "prenot", "takim", "dua nje", "book", "appointment", "caktoj", "dua te vij", "dua te porosit", "porosi", "schedule a"],
  greet: ["pershendetje", "ckemi", "tung", "hi", "hello", "hey", "tungjatjeta", "mirembrema", "miredita", "good morning"],
  thanks: ["faleminderit", "flm", "thanks", "thank", "rrofsh"],
};
function bizAddr() { const c = (biz && biz.config) || {}; return biz && (biz.address || c.city) ? [biz.address, c.city].filter(Boolean).join(", ") : ""; }
function bizContact() {
  const c = (biz && biz.config) || {}; const out = [];
  if (c.phone) out.push("📞 " + c.phone);
  if (c.whatsapp) out.push("💬 " + c.whatsapp);
  if (c.instagram) out.push("📷 " + c.instagram);
  if (c.email) out.push("✉ " + c.email);
  if (c.website) out.push("🌐 " + c.website);
  return out.join("\n");
}
function aiGreetText() { return tr2("aiGreet", (biz && biz.name) || "—"); }
function aiItemLine(s, full) {
  let t = s.name + " — " + money(s.price);
  if (s.kind !== "product") {
    const dv = s.duration_value != null ? s.duration_value : s.duration_min;
    if (dv) { const du = s.duration_unit ? tr(UNIT_KEY[s.duration_unit] || "unitMin") : tr("unitMin"); t += " (" + plainNum(dv) + " " + du + ")"; }
  } else if (s.unit_label) { t += " / " + s.unit_label; }
  if (full) {
    const tiers = priceTiers.filter((x) => x.service_id === s.id);
    if (tiers.length) t += " · " + tr("aiWholesale") + ": " + tiers.map((x) => plainNum(x.min_qty) + "+ → " + money(x.unit_price)).join(", ");
    const adds = Array.isArray(s.addons) ? s.addons : [];
    adds.forEach((a) => { if (a && a.name) t += "\n  + " + a.name + " " + money(a.price) + (a.required ? " (" + tr("addonReq") + ")" : " (" + tr("addonOpt") + ")"); });
    if (s.description) t += "\n  " + s.description;
  }
  return t;
}
function aiFindItem(q) {
  const nq = aiNorm(q); let best = null, score = 0;
  services.forEach((s) => {
    const name = aiNorm(s.name); if (!name) return; let sc = 0;
    if (nq.includes(name)) sc = name.length;
    else name.split(" ").forEach((w) => { if (w.length > 2 && nq.includes(w)) sc += w.length; });
    if (sc > score) { score = sc; best = s; }
  });
  return score >= 3 ? best : null;
}
function aiHoursText() {
  if (!Object.values(hours).some((h) => h)) return tr("aiAnsNoHours");
  let out = tr("aiAnsHoursHead");
  for (let i = 1; i <= 7; i++) {
    const dow = i % 7; const h = hours[dow];
    let line = T[lang].dayNames[dow] + ": " + (h ? h.open + "–" + h.close : tr("aiAnsClosed"));
    if (h) { const bs = rawBreaksFor(dow); if (bs.length) line += " (☕ " + bs.map((b) => b.start + "–" + b.end).join(", ") + ")"; }
    out += "\n• " + line;
  }
  return out;
}
// Truri: pyetje klienti → përgjigje me të dhënat reale të biznesit
function aiAnswer(q) {
  const nq = aiNorm(q);
  const has = (arr) => arr.some((k) => nq.includes(aiNorm(k)));
  if (has(AI_KW.price)) {
    const it = aiFindItem(q);
    if (it) return aiItemLine(it, true);
    if (services.length) return tr("aiAnsPriceList") + "\n" + services.slice(0, 6).map((s) => "• " + aiItemLine(s, false)).join("\n");
    return tr("aiAnsNoItems");
  }
  if (has(AI_KW.offer)) {
    if (!services.length) return tr("aiAnsNoItems");
    return tr("aiAnsOfferHead") + "\n" + services.slice(0, 12).map((s) => "• " + aiItemLine(s, false)).join("\n");
  }
  if (has(AI_KW.hours)) return aiHoursText();
  if (has(AI_KW.loc)) { const a = bizAddr(); return a ? tr2("aiAnsLoc", a) : tr("aiAnsNoLoc"); }
  if (has(AI_KW.contact)) { const c = bizContact(); return c || tr("aiAnsNoContact"); }
  if (has(AI_KW.book)) { const it = aiFindItem(q); return it ? tr2("aiAnsBookItem", it.name) : tr("aiAnsBook"); }
  if (has(AI_KW.thanks)) return tr("aiAnsThanks");
  if (has(AI_KW.greet)) return aiGreetText();
  const it = aiFindItem(q);
  if (it) return aiItemLine(it, true);
  if (biz && biz.ai_notes) return biz.ai_notes;
  if (biz && biz.config && biz.config.about) return biz.config.about;
  return tr("aiAnsFallback");
}
function aiPush(role, text) {
  const m = $("#aiMsgs"); if (!m) return;
  const b = document.createElement("div");
  b.className = "ai-bubble " + role;
  b.innerHTML = esc(text).replace(/\n/g, "<br>");
  m.appendChild(b); m.scrollTop = m.scrollHeight;
}
// Kur bëhet true (pasi useri ri-deploy-on funksionin chat me modin PREVIEW),
// demo-ja përdor trurin REAL (Gemini hibrid) pa shkruar asgjë në bazë.
const AI_DEMO_LIVE = false;
let aiSessionId = "demo-" + Math.random().toString(36).slice(2, 10);
function aiHistory() {
  const out = [];
  document.querySelectorAll("#aiMsgs .ai-bubble").forEach((b) => {
    if (b.classList.contains("typing")) return;
    out.push({ role: b.classList.contains("user") ? "user" : "bot", text: b.textContent });
  });
  return out.slice(-10);
}
async function aiSend(text) {
  const inp = $("#aiInput"); if (!inp) return;
  const q = (text != null ? text : inp.value).trim();
  if (!q) return;
  inp.value = "";
  const hist = aiHistory();
  aiPush("user", q);
  const m = $("#aiMsgs");
  const t = document.createElement("div");
  t.className = "ai-bubble ai typing"; t.innerHTML = "<span></span><span></span><span></span>";
  m.appendChild(t); m.scrollTop = m.scrollHeight;
  let reply = null, real = false;
  if (AI_DEMO_LIVE && biz && sb) {
    try {
      const { data, error } = await sb.functions.invoke("chat", { body: {
        business_id: biz.id, text: q, channel: "demo", chat_id: aiSessionId,
        client_name: "Vizitor (demo)", history: hist, preview: true,
      }});
      // Pranojmë vetëm versionin e ri (echo preview:true) → kurrë s'rrezikon rezervim real
      if (!error && data && data.reply && data.preview === true) { reply = data.reply; real = true; }
    } catch (_e) { /* bie te truri lokal */ }
  }
  if (reply == null) { await new Promise((r) => setTimeout(r, 360 + Math.random() * 300)); reply = aiAnswer(q); }
  t.remove();
  aiPush("ai", reply);
  const badge = document.querySelector(".ai-badge");
  if (badge) badge.textContent = real ? tr("aiBadgeReal") : tr("aiBadge");
}
function renderAiDemo() {
  const m = $("#aiMsgs"); if (!m || !biz) return;
  const hn = $("#aiHeadName"); if (hn) hn.textContent = biz.name || "AI";
  m.innerHTML = "";
  aiPush("ai", aiGreetText());
  const chips = $("#aiChips"); if (chips) {
    chips.innerHTML = "";
    ["aiChipOffer", "aiChipHours", "aiChipPrice", "aiChipBook"].forEach((k) => {
      const c = document.createElement("button");
      c.type = "button"; c.className = "ai-chip"; c.textContent = tr(k);
      c.onclick = () => aiSend(tr(k));
      chips.appendChild(c);
    });
  }
}

function openItem(s) {
  editingItemId = s ? s.id : null;
  $("#itemTitle").textContent = s ? tr("itemEdit") : tr("itemNew");
  $("#itemName").value = s ? s.name : "";
  $("#itemKind").value = s && s.kind === "product" ? "product" : "service";
  $("#itemDesc").value = s && s.description ? s.description : "";
  $("#itemPrice").value = s ? s.price : 0;
  if ($("#itemCost")) $("#itemCost").value = s && s.cost != null ? s.cost : "";
  if ($("#fldCost")) $("#fldCost").hidden = !profitOn();
  $("#itemUnit").value = s && s.unit_label ? s.unit_label : "";
  $("#itemTrack").checked = !!(s && s.track_stock);
  $("#itemStock").value = s && s.stock != null ? s.stock : "";
  $("#itemSku").value = s && s.sku ? s.sku : "";
  // Kohëzgjatja + prenotimi (për shërbime)
  if ($("#itemDurUnit")) $("#itemDurUnit").innerHTML = unitOptions(s && s.duration_unit ? s.duration_unit : "min");
  if ($("#itemDur")) $("#itemDur").value = s && s.duration_value != null ? s.duration_value : (s && s.duration_min != null ? s.duration_min : 30);
  if ($("#itemBook")) $("#itemBook").checked = s ? (s.bookable !== false) : true;
  $("#itemTiers").innerHTML = "";
  (s ? priceTiers.filter((t) => t.service_id === s.id) : []).forEach((t) => addTierRow(t.min_qty, t.unit_price));
  // Shtesat (montim, postë, garanci…)
  if ($("#itemAddons")) { $("#itemAddons").innerHTML = ""; ((s && Array.isArray(s.addons)) ? s.addons : []).forEach((a) => addAddonRow(a.name, a.price, a.cost, a.required)); }
  // Çelësat per-seksion: vendosi nga override-i i artikullit (ose default-i global)
  document.querySelectorAll("#itemModal .fit").forEach((c) => { c.checked = itemShowsField(s, c.dataset.f); c.onchange = applyItemFields; });
  $("#itemKind").onchange = applyItemFields;
  applyItemFields();
  $("#itemDelete").hidden = !s;
  $("#itemModal").hidden = false;
  setTimeout(() => $("#itemName").focus(), 60);
}

// Default-i global për një fushë (toggle-t "Catalog fields") — për fushat pa toggle global → true
const ITEM_FIELD_GLOBAL = { desc: "catDesc", unit: "catUnit", stock: "catStock", sku: "catSku", tiers: "catTiers" };
function itemShowsField(item, key) {
  const gk = ITEM_FIELD_GLOBAL[key];
  return OB.fieldVisible(key, item && item.hidden_fields, gk ? showField(gk) : true);
}
// Zbaton gjendjen on/off të secilit seksion (çelësi per-seksion) + llojin (shërbim/produkt)
function applyItemFields() {
  const isService = $("#itemKind") && $("#itemKind").value !== "product";
  document.querySelectorAll("#itemModal .opt-block").forEach((blk) => {
    const cb = blk.querySelector(".fit"); if (!cb) return;
    if (cb.dataset.f === "time") { blk.hidden = !isService; }  // produktet s'kanë kohë/prenotim
    blk.classList.toggle("off", !cb.checked);                  // off → trupi mblidhet (CSS)
  });
}
// Një rresht shtese (emër + çmim + kosto opsionale + e detyrueshme?)
function addAddonRow(name, price, cost, required) {
  const row = document.createElement("div");
  row.className = "addon-row";
  const n = document.createElement("input");
  n.type = "text"; n.className = "a-name"; n.maxLength = 50; n.placeholder = tr("addonNamePh"); n.value = name || "";
  const p = document.createElement("input");
  p.type = "number"; p.min = 0; p.step = 0.01; p.className = "a-price"; p.placeholder = tr("tierPrice"); p.value = price != null ? price : "";
  const c = document.createElement("input");
  c.type = "number"; c.min = 0; c.step = 0.01; c.className = "a-cost"; c.placeholder = tr("itemCost"); c.value = cost != null ? cost : ""; c.hidden = !profitOn();
  const reqWrap = document.createElement("label"); reqWrap.className = "a-req commerce-toggle";
  const reqC = document.createElement("input"); reqC.type = "checkbox"; reqC.className = "a-required"; reqC.checked = !!required;
  const reqT = document.createElement("span"); reqT.textContent = tr("addonRequired");
  reqWrap.append(reqC, reqT);
  const del = document.createElement("button");
  del.type = "button"; del.className = "t-del"; del.textContent = "✕"; del.onclick = () => row.remove();
  row.append(n, p, c, reqWrap, del);
  $("#itemAddons").appendChild(row);
}

function addTierRow(minQty, unitPrice) {
  const row = document.createElement("div");
  row.className = "tier-row";
  const q = document.createElement("input");
  q.type = "number"; q.min = 1; q.step = 1; q.className = "t-qty"; q.placeholder = tr("tierQty");
  q.value = minQty != null ? minQty : "";
  const p = document.createElement("input");
  p.type = "number"; p.min = 0; p.step = 0.01; p.className = "t-price"; p.placeholder = tr("tierPrice");
  p.value = unitPrice != null ? unitPrice : "";
  const del = document.createElement("button");
  del.type = "button"; del.className = "t-del"; del.textContent = "✕"; del.onclick = () => row.remove();
  row.appendChild(q); row.appendChild(p); row.appendChild(del);
  $("#itemTiers").appendChild(row);
}

async function saveItem() {
  const name = $("#itemName").value.trim();
  if (!name) { $("#itemName").focus(); return; }
  const track = $("#itemTrack").checked;
  const isService = $("#itemKind").value !== "product";
  const durUnit = $("#itemDurUnit") ? $("#itemDurUnit").value : "min";
  const durVal = $("#itemDur") ? Math.max(0, +$("#itemDur").value || 0) : 30;
  const payload = {
    business_id: biz.id, name,
    price: Number($("#itemPrice").value) || 0,
    kind: isService ? "service" : "product",
    description: $("#itemDesc").value.trim() || null,
    cost: ($("#itemCost") && $("#itemCost").value !== "") ? (Number($("#itemCost").value) || 0) : null,
    sku: $("#itemSku").value.trim() || null,
    unit_label: $("#itemUnit").value.trim() || null,
    track_stock: track,
    stock: track ? (Number($("#itemStock").value) || 0) : null,
    bookable: isService ? ($("#itemBook") ? $("#itemBook").checked : true) : false,
    duration_value: isService ? durVal : null,
    duration_unit: isService ? durUnit : null,
    duration_min: durToMin(durVal, durUnit),
  };
  // Shtesat (montim/postë/garanci…)
  const addons = [];
  document.querySelectorAll("#itemAddons .addon-row").forEach((r) => {
    const an = r.querySelector(".a-name").value.trim(); if (!an) return;
    const ap = Number(r.querySelector(".a-price").value) || 0;
    const acEl = r.querySelector(".a-cost");
    const ac = (acEl && acEl.value !== "") ? (Number(acEl.value) || 0) : null;
    addons.push({ name: an, price: ap, cost: ac, required: r.querySelector(".a-required").checked });
  });
  payload.addons = addons.length ? addons : null;
  // Fushat e fshehura për këtë artikull (override per-artikull)
  const hidden = [];
  document.querySelectorAll("#itemModal .fit").forEach((c) => { if (!c.checked) hidden.push(c.dataset.f); });
  payload.hidden_fields = hidden.length ? hidden : null;
  // Shkrim me fallback nëse kolonat e reja s'ekzistojnë ende (para SETUP-ALL.sql)
  const writeItem = async (pl) => {
    if (editingItemId) { const { error } = await sb.from("services").update(pl).eq("id", editingItemId); if (error) throw error; return editingItemId; }
    const { data, error } = await sb.from("services").insert({ ...pl, active: true }).select("id").single(); if (error) throw error; return data.id;
  };
  try {
    let itemId;
    try { itemId = await writeItem(payload); }
    catch (e1) { const { addons: _a, hidden_fields: _h, ...base } = payload; itemId = await writeItem(base); } // pa kolonat e reja
    // Shkallët e çmimit: fshi të vjetrat + rivendos
    await sb.from("price_tiers").delete().eq("service_id", itemId);
    const rows = [];
    document.querySelectorAll("#itemTiers .tier-row").forEach((r) => {
      const mq = Number(r.querySelector(".t-qty").value);
      const upv = r.querySelector(".t-price").value;
      if (mq > 0 && upv !== "") rows.push({ business_id: biz.id, service_id: itemId, min_qty: mq, unit_price: Number(upv) || 0 });
    });
    if (rows.length) await sb.from("price_tiers").insert(rows);
    $("#itemModal").hidden = true;
    await loadServices(); await loadTiers();
    renderCatalog();
    toast(tr("toastSaved"));
  } catch (ex) { errToast(ex); }
}

async function deleteItem() {
  if (!editingItemId) return;
  if (!confirm(tr("confirmDelete"))) return;
  try {
    await sb.from("services").delete().eq("id", editingItemId);
    $("#itemModal").hidden = true;
    await loadServices(); await loadTiers();
    renderCatalog();
    toast(tr("toastSaved"));
  } catch (ex) { errToast(ex); }
}

/* ---------------- Porositë (shitje të strukturuara: kush/çfarë/sa/çmim/status) ---------------- */
let editingOrderId = null;
const ST_KEY = { new: "stNew", confirmed: "stConfirmed", in_progress: "stInProgress", shipped: "stShipped", delivered: "stDelivered", completed: "stCompleted", cancelled: "stCancelled" };
const PAID_KEY = { unpaid: "paidUnpaid", partial: "paidPartial", paid: "paidPaid" };
const statusLabel = (s) => tr(ST_KEY[s] || "stNew");
const paidLabel = (s) => tr(PAID_KEY[s] || "paidUnpaid");
const plainNum = (n) => { const v = Number(n) || 0; return String(v); };

async function renderOrders() {
  const list = $("#ordersList");
  if (!list || !biz || !commerceOn()) return;
  const filter = ($("#orderFilter") && $("#orderFilter").value) || "open";
  let orders = [];
  try {
    const { data } = await sb.from("orders").select("*").eq("business_id", biz.id).order("placed_at", { ascending: false });
    orders = data || [];
  } catch (e) { return; }
  if (filter === "open") orders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  else if (filter !== "all") orders = orders.filter((o) => o.status === filter);
  if (!orders.length) { list.innerHTML = emptyHTML("🧾", tr("emptyOrders"), tr("emptyOrdersHint")); return; }
  // Artikujt për përmbledhje
  const itemsByOrder = {};
  try {
    const { data: its } = await sb.from("order_items").select("*").in("order_id", orders.map((o) => o.id));
    (its || []).forEach((it) => { (itemsByOrder[it.order_id] = itemsByOrder[it.order_id] || []).push(it); });
  } catch (e) {}
  list.innerHTML = "";
  orders.forEach((o) => {
    const items = itemsByOrder[o.id] || [];
    const sum = items.map((i) => `${esc(i.name)}×${plainNum(i.qty)}`).join(", ") || tr("noItems");
    const due = o.due_at ? ` · ${tr("etaShort")}: ${o.due_at}` : "";
    const card = document.createElement("div");
    card.className = "order-card" + (o.status === "cancelled" ? " cancelled" : "");
    card.innerHTML = `<span class="grow">
        <div class="order-who">${esc(o.customer_name || tr("noName"))}</div>
        <div class="order-sum">${sum}${due}</div>
      </span>
      <span class="order-right">
        <span class="order-amt">${money(o.total)}</span>
        <span class="status-badge ${o.status}">${statusLabel(o.status)}</span>
        <span class="paid-pill ${o.paid_status}">${paidLabel(o.paid_status)}</span>
      </span>`;
    card.onclick = () => openOrder(o, items);
    list.appendChild(card);
  });
}

function openOrder(o, items) {
  editingOrderId = o ? o.id : null;
  $("#orderTitle").textContent = o ? tr("orderEdit") : tr("orderNew");
  $("#orderCustomer").value = o ? (o.customer_name || "") : "";
  $("#orderContact").value = o ? (o.customer_contact || "") : "";
  $("#orderType").value = o && o.order_type === "wholesale" ? "wholesale" : "retail";
  $("#orderStatus").value = o ? o.status : "new";
  $("#orderPaid").value = o ? o.paid_status : "unpaid";
  $("#orderAmountPaid").value = o ? (o.amount_paid || 0) : 0;
  $("#orderDiscount").value = o ? (o.discount || 0) : 0;
  $("#orderDue").value = o && o.due_at ? o.due_at : "";
  $("#orderNotes").value = o ? (o.notes || "") : "";
  $("#orderLines").innerHTML = "";
  if (o && items && items.length) items.forEach((it) => addOrderLine(it.service_id, it.qty, it.unit_price));
  else addOrderLine();
  recomputeOrder();
  $("#orderDelete").hidden = !o;
  $("#orderModal").hidden = false;
  setTimeout(() => $("#orderCustomer").focus(), 60);
}

function addOrderLine(serviceId, qty, unitPrice) {
  const row = document.createElement("div");
  row.className = "order-line";
  const sel = document.createElement("select");
  sel.className = "ol-item";
  sel.innerHTML = `<option value="">${tr("olPick")}</option>` + services.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
  if (serviceId) sel.value = serviceId;
  const q = document.createElement("input");
  q.type = "number"; q.min = 0; q.step = "any"; q.className = "ol-qty"; q.value = qty != null ? qty : 1;
  const p = document.createElement("input");
  p.type = "number"; p.min = 0; p.step = "0.01"; p.className = "ol-price"; p.value = unitPrice != null ? unitPrice : "";
  const tot = document.createElement("span"); tot.className = "ol-total"; tot.textContent = "0";
  const del = document.createElement("button"); del.type = "button"; del.className = "ol-del"; del.textContent = "✕";
  del.onclick = () => { row.remove(); recomputeOrder(); };
  const autofill = () => {
    const it = svcById(sel.value);
    if (it) p.value = unitPriceFor(it, Number(q.value) || 0);
    recomputeOrder();
  };
  sel.onchange = autofill;
  q.oninput = autofill;
  p.oninput = recomputeOrder;
  row.appendChild(sel); row.appendChild(q); row.appendChild(p); row.appendChild(tot); row.appendChild(del);
  $("#orderLines").appendChild(row);
}

function recomputeOrder() {
  let sub = 0;
  document.querySelectorAll("#orderLines .order-line").forEach((r) => {
    const qv = Number(r.querySelector(".ol-qty").value) || 0;
    const pv = Number(r.querySelector(".ol-price").value) || 0;
    const lt = round2(qv * pv);
    r.querySelector(".ol-total").textContent = money(lt);
    sub = round2(sub + lt);
  });
  const disc = Number($("#orderDiscount").value) || 0;
  $("#orderSubtotal").textContent = money(sub);
  $("#orderTotal").textContent = money(Math.max(0, sub - disc));
}

async function saveOrder() {
  const lines = [];
  document.querySelectorAll("#orderLines .order-line").forEach((r) => {
    const sid = r.querySelector(".ol-item").value;
    const qv = Number(r.querySelector(".ol-qty").value) || 0;
    const pv = Number(r.querySelector(".ol-price").value) || 0;
    if (sid && qv > 0) { const it = svcById(sid) || {}; lines.push({ service_id: sid, name: it.name || "", qty: qv, unit_price: pv, line_total: round2(qv * pv), cost: it.cost != null ? Number(it.cost) : null }); }
  });
  if (!lines.length) { toast(tr("orderNeedItem")); return; }
  const sub = round2(lines.reduce((a, l) => a + l.line_total, 0));
  const disc = Number($("#orderDiscount").value) || 0;
  const order = {
    business_id: biz.id,
    customer_name: $("#orderCustomer").value.trim() || null,
    customer_contact: $("#orderContact").value.trim() || null,
    order_type: $("#orderType").value,
    status: $("#orderStatus").value,
    paid_status: $("#orderPaid").value,
    amount_paid: Number($("#orderAmountPaid").value) || 0,
    due_at: $("#orderDue").value || null,
    currency: biz.currency || "EUR",
    subtotal: sub, discount: disc, total: round2(Math.max(0, sub - disc)),
    notes: $("#orderNotes").value.trim() || null,
  };
  try {
    let oid = editingOrderId;
    if (oid) {
      await sb.from("orders").update(order).eq("id", oid);
      await sb.from("order_items").delete().eq("order_id", oid);
    } else {
      order.created_by = "manual";
      const { data, error } = await sb.from("orders").insert(order).select("id").single();
      if (error) throw error; oid = data.id;
    }
    const items = lines.map((l) => ({ order_id: oid, business_id: biz.id, service_id: l.service_id, name: l.name, qty: l.qty, unit_price: l.unit_price, line_total: l.line_total, cost: l.cost }));
    try { await sb.from("order_items").insert(items); }
    catch (e) { await sb.from("order_items").insert(items.map(({ cost, ...x }) => x)); } // fallback pa kolonën cost
    $("#orderModal").hidden = true;
    toast(tr("toastSaved"));
    await renderOrders();
  } catch (ex) { errToast(ex); }
}

async function deleteOrder() {
  if (!editingOrderId) return;
  if (!confirm(tr("confirmDelete"))) return;
  try {
    await sb.from("orders").delete().eq("id", editingOrderId);
    $("#orderModal").hidden = true;
    toast(tr("toastSaved"));
    await renderOrders();
  } catch (ex) { errToast(ex); }
}

// Faturë / Ofertë e printueshme (PDF nëpërmjet "Print → Save as PDF") nga porosia e hapur
function printInvoice() {
  const lines = [];
  document.querySelectorAll("#orderLines .order-line").forEach((r) => {
    const sid = r.querySelector(".ol-item").value;
    if (!sid) return;
    const qv = Number(r.querySelector(".ol-qty").value) || 0;
    const pv = Number(r.querySelector(".ol-price").value) || 0;
    if (qv > 0) lines.push({ name: (svcById(sid) || {}).name || "", qv, pv, lt: qv * pv });
  });
  if (!lines.length) { toast(tr("orderNeedItem")); return; }
  const sub = lines.reduce((a, l) => a + l.lt, 0);
  const disc = Number($("#orderDiscount").value) || 0;
  const total = Math.max(0, sub - disc);
  const paid = Number($("#orderAmountPaid").value) || 0;
  const outstanding = Math.max(0, total - paid);
  const isQuote = $("#orderStatus").value === "new";
  const docTitle = isQuote ? tr("invQuote") : tr("invInvoice");
  const customer = $("#orderCustomer").value.trim() || tr("noName");
  const contact = $("#orderContact").value.trim();
  const due = $("#orderDue").value;
  const notes = $("#orderNotes").value.trim();
  const today = new Date().toLocaleDateString();
  const docNo = (editingOrderId ? editingOrderId.slice(0, 8) : String(Date.now()).slice(-6)).toUpperCase();
  const rows = lines.map((l) => `<tr><td>${esc(l.name)}</td><td class="r">${plainNum(l.qv)}</td><td class="r">${money(l.pv)}</td><td class="r">${money(l.lt)}</td></tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${docTitle} ${docNo}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
body{color:#16201c;padding:40px;max-width:720px;margin:0 auto;font-size:14px}
.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0ca678;padding-bottom:18px;margin-bottom:22px}
.biz{font-size:22px;font-weight:800;color:#0ca678}
.biz small{display:block;color:#5a6a64;font-size:12px;font-weight:600;margin-top:3px}
.doc{text-align:right}
.doc h1{font-size:26px;letter-spacing:1px;color:#16201c}
.doc small{color:#5a6a64;font-weight:600}
.parties{display:flex;justify-content:space-between;gap:24px;margin-bottom:22px}
.parties .k{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#93a29c;font-weight:800;margin-bottom:4px}
.parties .v{font-weight:700}
table{width:100%;border-collapse:collapse;margin-bottom:18px}
th{background:#f0f4f2;text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#5a6a64}
th.r,td.r{text-align:right}
td{padding:10px 12px;border-bottom:1px solid #eef1ef;font-weight:600}
.totals{margin-left:auto;width:280px}
.totals .row{display:flex;justify-content:space-between;padding:5px 0;font-weight:700}
.totals .grand{border-top:2px solid #16201c;margin-top:6px;padding-top:9px;font-size:18px;font-weight:800}
.totals .grand .a{color:#0ca678}
.due{color:#e03131}
.notes{margin-top:22px;padding:14px 16px;background:#f7f9f8;border-radius:10px;color:#5a6a64;font-weight:600;font-size:13px}
.thanks{margin-top:26px;text-align:center;color:#0ca678;font-weight:800;font-size:16px}
@media print{body{padding:0}}
</style></head><body>
<div class="head">
  <div class="biz">${esc(biz.name)}${biz.address ? `<small>${esc(biz.address)}</small>` : ""}</div>
  <div class="doc"><h1>${docTitle}</h1><small>${tr("invNo")} ${docNo} · ${tr("invDate")}: ${today}</small></div>
</div>
<div class="parties">
  <div><div class="k">${tr("invTo")}</div><div class="v">${esc(customer)}${contact ? `<br>${esc(contact)}` : ""}</div></div>
  ${due ? `<div style="text-align:right"><div class="k">${tr("invETA")}</div><div class="v">${esc(due)}</div></div>` : ""}
</div>
<table>
  <thead><tr><th>${tr("invItem")}</th><th class="r">${tr("invQty")}</th><th class="r">${tr("invPrice")}</th><th class="r">${tr("invLineTotal")}</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals">
  <div class="row"><span>${tr("invSubtotal")}</span><span>${money(sub)}</span></div>
  ${disc > 0 ? `<div class="row"><span>${tr("invDiscount")}</span><span>-${money(disc)}</span></div>` : ""}
  <div class="row grand"><span>${tr("invTotal")}</span><span class="a">${money(total)}</span></div>
  ${paid > 0 ? `<div class="row"><span>${tr("invPaid")}</span><span>${money(paid)}</span></div>` : ""}
  ${outstanding > 0 && paid > 0 ? `<div class="row due"><span>${tr("invDue")}</span><span>${money(outstanding)}</span></div>` : ""}
</div>
${notes ? `<div class="notes"><strong>${tr("invNotes")}:</strong> ${esc(notes)}</div>` : ""}
<div class="thanks">${tr("invThanks")}</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch (e) {} }, 400);
}

/* ---------------- Raporte shitjesh (sa u shit, çfarë, te kush, kur) ---------------- */
let reportPeriod = "month";
let reportFrom = null, reportTo = null;

function periodRange(p) {
  const now = new Date();
  const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const eod = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  let from, to = eod(now);
  if (p === "today") from = sod(now);
  else if (p === "week") { from = sod(now); from.setDate(from.getDate() - 6); }
  else if (p === "lastMonth") { from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = eod(new Date(now.getFullYear(), now.getMonth(), 0)); }
  else if (p === "year") from = new Date(now.getFullYear(), 0, 1);
  else if (p === "custom") {
    from = reportFrom ? sod(parseDate(reportFrom)) : new Date(now.getFullYear(), now.getMonth(), 1);
    to = reportTo ? eod(parseDate(reportTo)) : eod(now);
  } else from = new Date(now.getFullYear(), now.getMonth(), 1); // month
  return { from, to };
}

async function renderReports() {
  const box = $("#reportsBox");
  if (!box || !biz) return;
  const periods = ["today", "week", "month", "lastMonth", "year", "custom"];
  box.innerHTML =
    `<div class="rep-periods">` +
    periods.map((p) => `<button class="rep-pbtn ${p === reportPeriod ? "active" : ""}" data-p="${p}">${tr("rep_" + p)}</button>`).join("") +
    `</div>
    <div class="rep-custom" ${reportPeriod === "custom" ? "" : "hidden"}>
      <input type="date" id="repFrom" value="${reportFrom || ""}">
      <input type="date" id="repTo" value="${reportTo || ""}">
      <button class="btn small primary" id="repApply">${tr("apply")}</button>
    </div>
    <div id="repResults"><div class="bi-load"></div></div>`;
  box.querySelectorAll(".rep-pbtn").forEach((b) => { b.onclick = () => { reportPeriod = b.dataset.p; renderReports(); }; });
  if ($("#repApply")) $("#repApply").onclick = () => { reportFrom = $("#repFrom").value || null; reportTo = $("#repTo").value || null; reportPeriod = "custom"; renderReports(); };

  const { from, to } = periodRange(reportPeriod);
  const results = $("#repResults");
  let orders = [], items = [];
  if (commerceOn()) {
    try {
      const { data } = await sb.from("orders").select("*").eq("business_id", biz.id)
        .gte("placed_at", from.toISOString()).lte("placed_at", to.toISOString());
      orders = (data || []).filter((o) => o.status !== "cancelled");
      if (orders.length) { const { data: it } = await sb.from("order_items").select("*").in("order_id", orders.map((o) => o.id)); items = it || []; }
    } catch (e) {}
  }
  // Takimet trajtohen si "shitje" → Ekonomia punon edhe për biznese me takime (jo vetëm tregti)
  let bookedMin = 0;
  try {
    const { data } = await sb.from("appointments").select("appt_date, status, client_name, services(name, price, duration_min, cost)")
      .eq("business_id", biz.id).gte("appt_date", fmtDate(from)).lte("appt_date", fmtDate(to));
    for (const a of (data || [])) {
      if (a.status === "cancelled" || a.status === "no_show") continue;
      const p = a.services ? Number(a.services.price) || 0 : 0;
      const c = (a.services && a.services.cost != null) ? Number(a.services.cost) : null;
      orders.push({ total: p, amount_paid: p, customer_name: a.client_name, order_type: "retail" });
      items.push({ name: a.services ? a.services.name : "—", qty: 1, line_total: p, cost: c });
      bookedMin += (a.services && a.services.duration_min) ? Number(a.services.duration_min) : 30;
    }
  } catch (e) {}
  if (!orders.length) { results.innerHTML = emptyHTML("💰", tr("repNoData"), tr("repNoDataHint")); return; }

  // Kapaciteti i mbushur për periudhën (orë pune − pushime, × staf) + orët e zëna
  const staffCount = Math.max(1, staff.length);
  const breakMinFor = (dow) => breaksFor(dow).reduce((a, [s, e]) => a + (e - s), 0);
  const dailyCap = (dow) => { const h = hours[dow]; if (!h) return 0; return Math.max(0, (toMin(h.close) - toMin(h.open)) - breakMinFor(dow)) * staffCount; };
  let capAvail = 0;
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) capAvail += dailyCap(d.getDay());
  const utilPct = capAvail > 0 ? Math.round(bookedMin / capAvail * 100) : 0;
  const bookedHours = bookedMin / 60;

  const revenue = orders.reduce((a, o) => a + (Number(o.total) || 0), 0);
  const paid = orders.reduce((a, o) => a + (Number(o.amount_paid) || 0), 0);
  const outstanding = Math.max(0, revenue - paid);
  const units = items.reduce((a, i) => a + (Number(i.qty) || 0), 0);
  const retailRev = orders.filter((o) => o.order_type !== "wholesale").reduce((a, o) => a + (Number(o.total) || 0), 0);
  const wholeRev = Math.max(0, revenue - retailRev);

  // Fitimi (opsional) — kosto e mallit, bruto, marzh, neto (pas shpenzimeve fikse të prorratuara)
  let profitHtml = "";
  if (profitOn()) {
    const cogs = round2(items.reduce((a, i) => a + ((i.cost != null ? Number(i.cost) : 0) * (Number(i.qty) || 0)), 0));
    const gross = round2(revenue - cogs);
    const margin = revenue > 0 ? Math.round((gross / revenue) * 100) : 0;
    const days = Math.max(1, Math.round((to - from) / 86400000) + 1);
    const fixed = round2(fixedMonthlyTotal() * days / 30);
    const net = round2(gross - fixed);
    // Ekonomia: pikë ekuilibri (sa të ardhura duhen për të mbuluar fiksat) + fitimi mesatar/porosi
    const marginRate = revenue > 0 ? gross / revenue : 0;
    const breakeven = marginRate > 0 ? round2(fixed / marginRate) : null;
    const profitPerOrder = orders.length ? round2(net / orders.length) : 0;
    profitHtml = `<div class="bi-h" style="margin-top:20px">💰 ${tr("repGross")}</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="num">${money(cogs)}</div><div class="lbl">${tr("repCogs")}</div></div>
        <div class="stat-card ${gross >= 0 ? "" : "warn"}"><div class="num">${money(gross)}</div><div class="lbl">${tr("repGross")}</div></div>
        <div class="stat-card"><div class="num">${margin}%</div><div class="lbl">${tr("repMargin")}</div></div>
        <div class="stat-card ${net >= 0 ? "highlight" : "warn"}"><div class="num">${money(net)}</div><div class="lbl">${tr("repNet")} ${fixed > 0 ? `<small style="font-weight:600;color:var(--ink-faint)">${tr("repNetHint")}</small>` : ""}</div></div>
      </div>
      <div class="stats-grid">
        ${breakeven != null && fixed > 0 ? `<div class="stat-card ${revenue >= breakeven ? "" : "warn"}"><div class="num">${money(breakeven)}</div><div class="lbl">${tr("repBreakeven")} <small style="font-weight:600;color:var(--ink-faint)">${revenue >= breakeven ? tr("repBeOk") : tr("repBeUnder")}</small></div></div>` : ""}
        <div class="stat-card"><div class="num">${money(profitPerOrder)}</div><div class="lbl">${tr("repProfitOrder")}</div></div>
        ${(capAvail > 0 && bookedHours > 0) ? `<div class="stat-card"><div class="num">${money(round2(net / bookedHours))}</div><div class="lbl">${tr("repProfitHour")}</div></div>` : ""}
      </div>
      <div class="whatif" id="whatIf" data-rev="${revenue}" data-cogs="${cogs}" data-fixed="${fixed}" data-net="${net}">
        <div class="bi-h" style="margin-top:16px">🔮 ${tr("repWhatIf")}</div>
        <p class="exp-hint" data-t="repWhatIfHint">Po të ndryshoja çmimet, sa do bëhej fitimi? (duke supozuar të njëjtën sasi)</p>
        <div class="wi-row"><input type="range" id="wiRange" min="-30" max="30" step="5" value="0"><span class="wi-pct" id="wiPct">0%</span></div>
        <div class="wi-out" id="wiOut"></div>
      </div>`;
  }

  // Ekonomia e klientit (gjithmonë): klientë unikë, ardhura mesatare/klient, % që kthehen
  const custCount = {};
  orders.forEach((o) => { const k = (o.customer_name || "").trim() || "?"; custCount[k] = (custCount[k] || 0) + 1; });
  const uniqKeys = Object.keys(custCount).filter((k) => k !== "?");
  const uniqCust = uniqKeys.length || Object.keys(custCount).length;
  const repeatN = uniqKeys.filter((k) => custCount[k] > 1).length;
  const repeatRate = uniqCust ? Math.round(repeatN / uniqCust * 100) : 0;
  const avgCust = uniqCust ? round2(revenue / uniqCust) : 0;
  const custEconHtml = `<div class="bi-h" style="margin-top:20px">👤 ${tr("repCustEcon")}</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="num">${plainNum(uniqCust)}</div><div class="lbl">${tr("repUniqCust")}</div></div>
      <div class="stat-card"><div class="num">${money(avgCust)}</div><div class="lbl">${tr("repAvgCust")}</div></div>
      <div class="stat-card ${repeatRate >= 30 ? "highlight" : ""}"><div class="num">${repeatRate}%</div><div class="lbl">${tr("repRepeatRate")}</div></div>
    </div>`;

  // Kapaciteti (kur ka orar pune) — % e mbushur + orët e zëna
  const capHtml = capAvail > 0 ? `<div class="bi-h" style="margin-top:20px">⏳ ${tr("repCapacity")}</div>
    <div class="stats-grid">
      <div class="stat-card ${utilPct >= 70 ? "highlight" : (utilPct < 30 ? "warn" : "")}"><div class="num">${utilPct}%</div><div class="lbl">${tr("repCapFilled")}</div></div>
      <div class="stat-card"><div class="num">${plainNum(Math.round(bookedHours))}h</div><div class="lbl">${tr("repBookedHours")}</div></div>
    </div>` : "";

  const prod = {};
  items.forEach((i) => { const k = i.name || "—"; prod[k] = prod[k] || { qty: 0, rev: 0 }; prod[k].qty += Number(i.qty) || 0; prod[k].rev += Number(i.line_total) || 0; });
  const topProd = Object.entries(prod).sort((a, b) => b[1].rev - a[1].rev).slice(0, 6);
  const maxRev = topProd.length ? topProd[0][1].rev || 1 : 1;

  const cust = {};
  orders.forEach((o) => { const k = o.customer_name || tr("noName"); cust[k] = (cust[k] || 0) + (Number(o.total) || 0); });
  const topCust = Object.entries(cust).sort((a, b) => b[1] - a[1]).slice(0, 6);

  results.innerHTML = `
    <div class="stats-grid-top">
      <div class="stat-card highlight"><div class="num">${money(revenue)}</div><div class="lbl">${tr("repRevenue")}</div></div>
      <div class="stat-card"><div class="num">${orders.length}</div><div class="lbl">${tr("repOrders")}</div></div>
      <div class="stat-card"><div class="num">${plainNum(units)}</div><div class="lbl">${tr("repUnits")}</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="num">${money(paid)}</div><div class="lbl">${tr("repPaid")}</div></div>
      <div class="stat-card ${outstanding > 0 ? "warn" : ""}"><div class="num">${money(outstanding)}</div><div class="lbl">${tr("repOutstanding")}</div></div>
      <div class="stat-card"><div class="num">${money(retailRev)}</div><div class="lbl">${tr("repRetail")}</div></div>
      <div class="stat-card"><div class="num">${money(wholeRev)}</div><div class="lbl">${tr("repWholesale")}</div></div>
    </div>
    ${profitHtml}
    ${capHtml}
    ${custEconHtml}
    <div class="bi-cols">
      <div class="bi-box"><h4 class="bi-h">${tr("repTopProducts")}</h4>
        ${topProd.map(([n, d]) => `<div class="bi-bar-row"><span class="bi-bar-lbl">${esc(n)} <small style="color:var(--ink-faint)">×${plainNum(d.qty)}</small></span><span class="bi-bar"><span class="bi-bar-fill" style="width:${Math.round((d.rev / maxRev) * 100)}%"></span></span><span class="bi-bar-num">${money(d.rev)}</span></div>`).join("")}
      </div>
      <div class="bi-box"><h4 class="bi-h">${tr("repTopCustomers")}</h4>
        ${topCust.map(([n, v], i) => `<div class="bi-vip-row"><span class="bi-rank">${i + 1}</span><span class="bi-vip-name">${esc(n)}</span><span class="bi-vip-c">${money(v)}</span></div>`).join("")}
      </div>
    </div>`;

  // Simulatori "po të ndryshoja çmimin" (interaktiv)
  const wi = $("#whatIf");
  if (wi) {
    const rev = Number(wi.dataset.rev), cogs0 = Number(wi.dataset.cogs), fixed0 = Number(wi.dataset.fixed), net0 = Number(wi.dataset.net);
    const r = $("#wiRange"), out = $("#wiOut"), pct = $("#wiPct");
    const recompute = () => {
      const p = Number(r.value);
      const nr = rev * (1 + p / 100);          // sasia konstante → të ardhurat ndryshojnë me çmimin
      const nn = round2(nr - cogs0 - fixed0);   // kosto e mallit + fiksat mbeten njësoj
      const delta = round2(nn - net0);
      pct.textContent = (p > 0 ? "+" : "") + p + "%";
      out.innerHTML = `${tr("repWhatIfRev")}: <b>${money(nr)}</b> · ${tr("repNet")}: <b class="${nn >= 0 ? "" : "wi-neg"}">${money(nn)}</b> <small class="${delta >= 0 ? "wi-pos" : "wi-neg"}">(${delta >= 0 ? "+" : ""}${money(delta)})</small>`;
    };
    r.oninput = recompute; recompute();
  }
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
  const mode = (biz && biz.mode) || "appointments";
  const showAppt = mode !== "inquiry";                 // takime OSE të dyja → kalendar
  const showLeads = mode === "inquiry" || mode === "both"; // porosi OSE të dyja → kërkesa
  const commerce = commerceOn();
  const apptTabs = ["calendar", "appointments", "blocks", "waitlist", "staff"]; // "customers" = universal (takime + porosi)
  const commerceTabs = ["orders"]; // Ekonomia & Katalogu = gjithmonë të dukshme; vetëm Porositë kushtëzohen me tregti
  document.querySelectorAll(".tabs .tab").forEach((t) => {
    const tab = t.dataset.tab;
    if (apptTabs.includes(tab)) t.hidden = !showAppt;
    else if (tab === "leads") t.hidden = !showLeads;
    else if (commerceTabs.includes(tab)) t.hidden = !commerce;
  });
  const shb = $("#setHoursBlock"); if (shb) shb.hidden = !showAppt; // orari vetëm kur ka kalendar
  setBotnavForMode(mode);
  const active = document.querySelector(".tab.active");
  if (active && active.hidden) {
    const fb = document.querySelector('.tab[data-tab="stats"]') || document.querySelector(".tab:not([hidden])");
    if (fb) fb.click();
  }
}

// Bottom-nav adaptiv: biznes me porosi → Porositë/Kërkesa; me takime → Kalendari/Takimet
function setBotnavForMode(mode) {
  const btns = document.querySelectorAll('#botnav button[data-go]'); // [stats, slot2, slot3, reports]
  if (btns.length < 4) return;
  const m = (mode === "inquiry")
    ? [["orders", "🧾", tr("bnOrders")], ["leads", "📥", tr("bnLeads")]]
    : [["calendar", "📅", tr("bnCal")], ["appointments", "📋", tr("bnAppt")]];
  [[btns[1], m[0]], [btns[2], m[1]]].forEach(([btn, cfg]) => {
    btn.dataset.go = cfg[0];
    const i = btn.querySelector(".bn-i"); if (i) i.textContent = cfg[1];
    const l = btn.querySelector(".bn-l"); if (l) l.textContent = cfg[2];
  });
  if (typeof syncBotnav === "function") syncBotnav();
}

/* ---------------- Cilësimet (edito gjithçka pas regjistrimit) ---------------- */

// Pushimet gjatë ditës (p.sh. dreka) — ruhen te config.breaks[dow] = [{start,end}]
function rawBreaksFor(dow) {
  const b = (biz && biz.config && biz.config.breaks) || {};
  const v = b[dow] != null ? b[dow] : b[String(dow)];
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).filter((x) => x && x.start && x.end);
}
function breaksFor(dow) {
  return rawBreaksFor(dow).map((x) => [toMin(x.start), toMin(x.end)]).filter(([s, e]) => e > s);
}
// Shton një rresht pushimi (mund të ketë disa në ditë)
function addBreakRow(listEl, start, end) {
  const r = document.createElement("div");
  r.className = "hr-break";
  r.innerHTML = `
    <span class="hr-break-lbl">☕</span>
    <input type="time" class="h-bstart" value="${start || ""}">
    <span>–</span>
    <input type="time" class="h-bend" value="${end || ""}">
    <button type="button" class="btn-round sm danger hr-bdel" aria-label="${tr("clearBreak")}"><span>×</span></button>`;
  r.querySelector(".hr-bdel").onclick = () => r.remove();
  listEl.appendChild(r);
}
function renderSettingsHours() {
  const hb = $("#setHours"); if (!hb) return;
  hb.innerHTML = "";
  for (let i = 1; i <= 7; i++) {
    const dow = i % 7;
    const h = hours[dow];
    const closed = !h;
    const brks = rawBreaksFor(dow);
    const row = document.createElement("div");
    row.className = "hours-row"; row.dataset.dow = dow;
    row.innerHTML = `
      <div class="hr-main">
        <span class="day">${T[lang].dayNames[dow]}</span>
        <input type="time" class="h-open" value="${h ? h.open : "09:00"}" ${closed ? "disabled" : ""}>
        <span>–</span>
        <input type="time" class="h-close" value="${h ? h.close : "19:00"}" ${closed ? "disabled" : ""}>
        <label class="closed-toggle"><input type="checkbox" class="h-closed" ${closed ? "checked" : ""}> ${tr("closed")}</label>
      </div>
      <div class="hr-breaks" ${closed ? "hidden" : ""}>
        <span class="hr-breaks-lbl">☕ ${tr("breakLbl")}</span>
        <div class="hr-break-list"></div>
        <button type="button" class="hr-addbreak" data-t="addBreak">+ ${tr("addBreak")}</button>
      </div>`;
    const list = row.querySelector(".hr-break-list");
    brks.forEach((b) => addBreakRow(list, b.start, b.end));
    row.querySelector(".hr-addbreak").onclick = () => addBreakRow(list, "", "");
    row.querySelector(".h-closed").addEventListener("change", (e) => {
      const off = e.target.checked;
      row.querySelector(".h-open").disabled = off;
      row.querySelector(".h-close").disabled = off;
      const brkArea = row.querySelector(".hr-breaks"); if (brkArea) brkArea.hidden = off;
    });
    hb.appendChild(row);
  }
}

function renderSettings() {
  if (!biz) return;
  const sn = $("#setName"); if (sn) sn.value = biz.name || "";
  const sa = $("#setAddress"); if (sa) sa.value = biz.address || "";
  const tg = $("#tgToken"); if (tg) tg.value = biz.telegram_token || "";
  const bid = $("#bizIdVal"); if (bid) bid.textContent = biz.id;
  const pubBase = location.href.split("?")[0].replace(/[^/]*$/, "") + "book.html?b=" + biz.id;
  const pl = $("#pubLink"); if (pl) pl.value = pubBase;
  const op = $("#openPubLink"); if (op) op.href = pubBase;
  const co = $("#commerceOn"); if (co) co.checked = !!biz.commerce_enabled;
  const cc = $("#bizCurrency"); if (cc) cc.value = biz.currency || "EUR";
  const cfg = biz.config || {};
  const setCfg = (id, key) => { const el = $(id); if (el) el.value = cfg[key] || ""; };
  setCfg("#bizPhone", "phone"); setCfg("#bizEmail", "email"); setCfg("#bizWebsite", "website");
  setCfg("#bizInstagram", "instagram"); setCfg("#bizCity", "city"); setCfg("#bizAbout", "about");
  const pc = $("#profitOnChk"); if (pc) pc.checked = !!cfg.profitOn;
  const fxf = $("#fixedCostField"); if (fxf) fxf.hidden = !cfg.profitOn;
  renderFixedCosts();
  // Ekipi: vetëm pronari menaxhon qasjen
  const owner = !!(myUserId && biz.owner_id === myUserId);
  const tb = $("#teamBlock"); if (tb) tb.hidden = !owner;
  const dz = $("#dangerZone"); if (dz) dz.hidden = !owner;
  if (owner) renderTeam();
  // Toggle-t e fushave të katalogut (Katalogu = vendi i vetëm; gjithmonë i dukshëm)
  if ($("#cfgDesc")) $("#cfgDesc").checked = showField("catDesc");
  if ($("#cfgUnit")) $("#cfgUnit").checked = showField("catUnit");
  if ($("#cfgStock")) $("#cfgStock").checked = showField("catStock");
  if ($("#cfgSku")) $("#cfgSku").checked = showField("catSku");
  if ($("#cfgTiers")) $("#cfgTiers").checked = showField("catTiers");
  updateTgWebhookLink();
  renderSettingsHours();
}

// Fshirja e biznesit — me verifikim (shkruaj emrin + konfirmim njerëzor)
function openDeleteBiz() {
  $("#delBizMsg").innerHTML = `${esc(tr("delBizMsg"))} <b>${esc(biz.name)}</b>`;
  $("#delBizName").value = ""; $("#delBizName").placeholder = biz.name;
  if ($("#delBizHuman")) $("#delBizHuman").checked = false;
  $("#delBizGo").disabled = true;
  $("#deleteBizModal").hidden = false;
  setTimeout(() => $("#delBizName").focus(), 60);
}
function delBizCheck() {
  const ok = $("#delBizName").value.trim() === (biz && biz.name) && $("#delBizHuman") && $("#delBizHuman").checked;
  $("#delBizGo").disabled = !ok;
}
async function doDeleteBiz() {
  const id = biz.id;
  $("#delBizGo").disabled = true;
  try {
    const { error } = await sb.from("businesses").delete().eq("id", id);
    if (error) throw error;
    businesses = businesses.filter((b) => b.id !== id);
    try { localStorage.removeItem("ob-active-biz"); } catch (e) {}
    $("#deleteBizModal").hidden = true;
    toast(tr("toastDeleted"));
    if (businesses.length) {
      biz = businesses[0]; setActiveBiz(biz.id); renderBizSwitch();
      $("#bizName").textContent = tr("panelPrefix") + biz.name;
      await loadAll();
    } else {
      biz = null; addingBiz = false; openOnboard(); showView("onboard");
    }
  } catch (ex) { errToast(ex); $("#delBizGo").disabled = false; }
}

// Ekipi: lista e anëtarëve (vetëm pronari)
async function renderTeam() {
  const list = $("#teamList");
  if (!list) return;
  let rows = [];
  try { const { data } = await sb.from("team_members").select("*").eq("business_id", biz.id).order("created_at"); rows = data || []; }
  catch (e) { list.innerHTML = ""; return; }
  if (!rows.length) { list.innerHTML = emptyHTML("👥", tr("teamEmpty"), tr("teamEmptyHint")); return; }
  list.innerHTML = "";
  rows.forEach((m) => {
    const item = document.createElement("div");
    item.className = "team-row";
    item.innerHTML = `<span class="grow">👤 <strong>${esc(m.email)}</strong> <small style="color:var(--ink-faint)">· ${m.role === "manager" ? tr("roleManager") : tr("roleStaff")}</small></span>`;
    const del = document.createElement("button");
    del.className = "btn small ghost danger"; del.textContent = tr("remove");
    del.onclick = async () => { try { await sb.from("team_members").delete().eq("id", m.id); renderTeam(); toast(tr("toastSaved")); } catch (ex) { errToast(ex); } };
    item.appendChild(del);
    list.appendChild(item);
  });
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


async function saveHoursEdit() {
  const rows = [...document.querySelectorAll("#setHours .hours-row")];
  const breaks = {};
  for (const r of rows) {
    const dow = +r.dataset.dow;
    const closed = r.querySelector(".h-closed").checked;
    await sb.from("working_hours").upsert({
      business_id: biz.id, weekday: dow, is_closed: closed,
      open_time: closed ? null : r.querySelector(".h-open").value,
      close_time: closed ? null : r.querySelector(".h-close").value,
    }, { onConflict: "business_id,weekday" });
    if (!closed) {
      const dayBreaks = [];
      r.querySelectorAll(".hr-break-list .hr-break").forEach((br) => {
        const bs = br.querySelector(".h-bstart").value;
        const be = br.querySelector(".h-bend").value;
        if (bs && be && be > bs) dayBreaks.push({ start: bs, end: be });
      });
      dayBreaks.sort((a, b) => a.start.localeCompare(b.start));
      if (dayBreaks.length) breaks[dow] = dayBreaks;
    }
  }
  // Pushimet ruhen te businesses.config (pa ndryshim skeme në bazë)
  const cfg = Object.assign({}, biz.config || {}); cfg.breaks = breaks;
  try { await sb.from("businesses").update({ config: cfg }).eq("id", biz.id); biz.config = cfg; } catch (e) {}
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
  }).concat(blocks.map((b) => [toMin(hm(b.from_time)), toMin(hm(b.to_time))]))
    .concat(breaksFor(d.getDay())); // pushimet gjatë ditës bllokohen si "të zëna"
  const isToday = ds === fmtDate(new Date());
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  // Gjenerimi i sloteve = logjikë e testuar te core.js (e njëjta për panel + faqe publike)
  return OB.computeSlots({ openMin: open, closeMin: close, durMin, stepMin: SLOT_STEP, busy, nowMin: isToday ? nowM : null, includePast });
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
// Kthen kohëzgjatjen në minuta (logjikë e testuar te core.js)
function durToMin(value, unit) { return OB.durToMin(value, unit); }

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
  const back = $("#obBack"); if (back) back.hidden = !addingBiz; // "Kthehu" vetëm kur shton biznes shtesë
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
    if (!addingBiz) {
      // Mbrojtje nga dublikatat (vetëm te regjistrimi i parë; jo kur shtohet biznes i ri)
      await loadBusiness();
      if (biz) { renderBizSwitch(); await loadAll(); showView("app"); return; }
    }

    const { data: { user } } = await sb.auth.getUser();
    const row = {
      owner_id: user.id, name, type: $("#obType").value,
      address: $("#obAddress").value.trim(), lang,
    };
    if ($("#obMode")) row.mode = $("#obMode").value;   // takime ose porosi/kërkesa
    const { data: b, error } = await sb.from("businesses").insert(row).select().single();
    if (error) throw error;
    biz = b;
    businesses.push(b);
    setActiveBiz(b.id);
    addingBiz = false;

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

    renderBizSwitch();
    await loadAll();
    showView("app");
    toast(tr("toastSaved"));
  } catch (ex) {
    errToast(ex);
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
  const map = {};
  const keyFor = (name, fallback) => ((name && name.trim().toLowerCase()) || fallback || "?");
  // Nga takimet
  const { data } = await sb.from("appointments")
    .select("client_name, chat_id, channel, appt_date, status, services(price)").eq("business_id", biz.id);
  for (const a of (data || [])) {
    if (a.status === "cancelled") continue;
    const key = keyFor(a.client_name, a.chat_id);
    const c = map[key] || { name: a.client_name || "Klient", channel: a.channel || "manual", visits: 0, last: "", spent: 0 };
    if (a.client_name) c.name = a.client_name;
    c.visits++; c.spent += a.services ? Number(a.services.price) || 0 : 0;
    if (a.appt_date > c.last) c.last = a.appt_date;
    map[key] = c;
  }
  // Nga porositë (biznese tregtie/të dyja)
  try {
    const { data: od } = await sb.from("orders").select("customer_name, total, status, placed_at, channel").eq("business_id", biz.id);
    for (const o of (od || [])) {
      if (o.status === "cancelled") continue;
      const key = keyFor(o.customer_name, null);
      const c = map[key] || { name: o.customer_name || "Klient", channel: o.channel || "order", visits: 0, last: "", spent: 0 };
      if (o.customer_name) c.name = o.customer_name;
      c.visits++; c.spent += Number(o.total) || 0;
      const d = (o.placed_at || "").slice(0, 10); if (d > c.last) c.last = d;
      map[key] = c;
    }
  } catch (e) {}
  let rows = Object.values(map).filter((c) => c.visits > 0).sort((a, b) => (b.last || "").localeCompare(a.last || ""));
  const q = ($("#custSearch") && $("#custSearch").value.trim().toLowerCase()) || "";
  if (q) rows = rows.filter((c) => (c.name || "").toLowerCase().includes(q));
  if (!rows.length) { list.innerHTML = emptyHTML("👤", tr("emptyCustomers"), tr("emptyCustomersHint")); return; }
  list.innerHTML = "";
  for (const c of rows) {
    const item = document.createElement("div");
    item.className = "block-item";
    item.innerHTML = `<span class="grow">👤 <strong>${esc(c.name)}</strong> <small style="color:var(--ink-faint)">· ${esc(c.channel)}</small></span>
      <span style="font-size:12.5px;font-weight:700;color:var(--ink-soft);white-space:nowrap">${c.visits} ${tr("visitsW")} · ${money(c.spent)}${c.last ? " · " + humanDate(c.last) : ""}</span>`;
    list.appendChild(item);
  }
}

async function renderActivity() {
  const list = $("#activityList"); if (!list) return;
  const { data } = await sb.from("notifications").select("*").eq("business_id", biz.id)
    .order("created_at", { ascending: false }).limit(60);
  const rows = data || [];
  if (!rows.length) { list.innerHTML = emptyHTML("🔔", tr("emptyActivity"), tr("emptyActivityHint")); return; }
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
  if (!rows.length) { list.innerHTML = emptyHTML("📥", tr("emptyLeads"), tr("emptyLeadsHint")); return; }
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
    if (!locations.length) ll.innerHTML = emptyHTML("📍", tr("emptyLoc"));
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
    if (!staff.length) stl.innerHTML = emptyHTML("👥", tr("emptyStaff"));
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
  if (!rows.length) { list.innerHTML = emptyHTML("⏳", tr("emptyWait"), tr("emptyWaitHint")); return; }
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
  if (!h) { tl.innerHTML = emptyHTML("🌙", tr("dayOff")); return; }
  const open = toMin(h.open), close = toMin(h.close);
  let appts = await apptsForDate(calDate);
  let blocks = await blocksForDate(calDate);
  if (calStaff) {
    appts = appts.filter((a) => a.staff_id === calStaff);
    blocks = blocks.filter((b) => !b.staff_id || b.staff_id === calStaff);
  }
  const brks = breaksFor(d.getDay());
  for (let t = open; t < close; t += SLOT_STEP) {
    const row = document.createElement("div");
    const appt = appts.find((a) => {
      const s = svcById(a.service_id); const st = toMin(hm(a.appt_time));
      return t >= st && t < st + (s ? s.duration_min : SLOT_STEP);
    });
    const block = blocks.find((b) => t >= toMin(hm(b.from_time)) && t < toMin(hm(b.to_time)));
    const inBreak = brks.some(([s, e]) => t >= s && t < e);
    if (!appt && inBreak) {
      row.className = "slot break";
      row.innerHTML = `<span class="time">${toHM(t)}</span><span class="label">☕ ${tr("breakLbl")}</span>`;
      tl.appendChild(row); continue;
    }
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
  const list = $("#apptList"); list.innerHTML = skel(4);
  const today = fmtDate(new Date());
  const { data } = await sb.from("appointments").select("*").eq("business_id", biz.id)
    .gte("appt_date", today).order("appt_date").order("appt_time");
  const appts = data || [];
  if (!appts.length) { list.innerHTML = emptyHTML("📅", tr("emptyAppt"), tr("emptyApptHint")); return; }
  list.innerHTML = "";  // pastro skeleton-in
  for (const a of appts) {
    const s = svcById(a.service_id); const d = parseDate(a.appt_date);
    const card = document.createElement("div");
    card.className = "appt-card" + (a.status === "cancelled" ? " cancelled" : "");
    card.innerHTML = `
      <div class="appt-when">${hm(a.appt_time)}<small>${d.getDate()} ${T[lang].months[d.getMonth()]}</small></div>
      <div class="appt-info">
        <div class="who">${esc(a.client_name)}</div>
        <div class="what">${s ? esc(s.name) + " • " + money(s.price) : ""} • ${a.source === "ai" ? tr("bookedAi") : tr("manual")}${staffName(a.staff_id) ? " • 👤 " + esc(staffName(a.staff_id)) : ""}
          ${a.status === "confirmed" ? ` • <span style="color:var(--accent-deep)">${tr("confirmedW")}</span>` : ""}
          ${a.status === "attended" ? ` • <span style="color:var(--accent-deep)">${tr("attendedW")}</span>` : ""}
          ${a.status === "no_show" ? ` • <span style="color:var(--red)">${tr("noShowW")}</span>` : ""}
          ${a.status === "cancelled" ? ` • <span style="color:var(--red)">${tr("cancelledW")}</span>` : ""}
        </div>
      </div>
      <div class="appt-actions"></div>`;
    const act = card.querySelector(".appt-actions");
    const mkBtn = (cls, txt, fn) => { const b = document.createElement("button"); b.className = "btn small " + cls; b.textContent = txt; b.onclick = fn; act.appendChild(b); return b; };
    if (a.status !== "cancelled" && a.status !== "no_show" && a.status !== "attended") {
      if (a.status !== "confirmed") mkBtn("", tr("confirmBtn"), () => setStatus(a.id, "confirmed"));
      mkBtn("ghost", "🔄 " + tr("rescheduleBtn"), () => rescheduleAppt(card, a));
      if (a.appt_date <= today) {
        mkBtn("ghost", "✓ " + tr("attendedBtn"), () => setStatus(a.id, "attended"));
        mkBtn("ghost danger", "✘ " + tr("noShowBtn"), () => setStatus(a.id, "no_show", a.status));
      }
      mkBtn("ghost danger", tr("cancelBtn"), () => setStatus(a.id, "cancelled", a.status));
    }
    list.appendChild(card);
    attachSwipe(card, a, today);
  }
}

// Swipe mbi kartën e takimit (telefon): djathtas → erdhi/konfirmo, majtas → anulo
function attachSwipe(card, a, today) {
  if (a.status === "cancelled" || a.status === "no_show" || a.status === "attended") return;
  let x0 = null, y0 = null, dx = 0, dragging = false;
  card.addEventListener("touchstart", (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; dx = 0; dragging = false; card.style.transition = "none"; }, { passive: true });
  card.addEventListener("touchmove", (e) => {
    if (x0 == null) return;
    const t = e.touches[0], ddx = t.clientX - x0, ddy = t.clientY - y0;
    if (!dragging && Math.abs(ddx) < Math.abs(ddy)) { x0 = null; return; }  // lëvizje vertikale → scroll normal
    dragging = true; dx = Math.max(-130, Math.min(130, ddx));
    card.style.transform = "translateX(" + dx + "px)";
    card.classList.toggle("swipe-r", dx > 35);
    card.classList.toggle("swipe-l", dx < -35);
  }, { passive: true });
  const end = () => {
    if (x0 == null) { return; }
    card.style.transition = "transform .25s ease"; card.style.transform = "";
    card.classList.remove("swipe-r", "swipe-l");
    if (dx > 85) { haptic(15); setStatus(a.id, a.appt_date <= today ? "attended" : "confirmed"); }
    else if (dx < -85) { haptic(15); setStatus(a.id, "cancelled", a.status); }
    x0 = null;
  };
  card.addEventListener("touchend", end, { passive: true });
  card.addEventListener("touchcancel", end, { passive: true });
}

// Ricaktim i shpejtë (inline): zëvendëson veprimet me datë + orë + ruaj
async function rescheduleAppt(card, a) {
  const act = card.querySelector(".appt-actions");
  act.innerHTML = "";
  const dIn = document.createElement("input"); dIn.type = "date"; dIn.value = a.appt_date; dIn.className = "resched-d";
  const tIn = document.createElement("input"); tIn.type = "time"; tIn.step = "1800"; tIn.value = hm(a.appt_time); tIn.className = "resched-t";
  const ok = document.createElement("button"); ok.className = "btn small primary"; ok.textContent = "✓";
  const no = document.createElement("button"); no.className = "btn small ghost"; no.textContent = "✕";
  ok.onclick = async () => {
    if (!dIn.value || !tIn.value) return;
    try {
      const { error } = await sb.from("appointments").update({ appt_date: dIn.value, appt_time: tIn.value, status: "pending" }).eq("id", a.id);
      if (error) throw error;
      toast(tr("toastRescheduled")); await renderAll();
    } catch (ex) { errToast(ex); }
  };
  no.onclick = () => renderAppointments();
  act.append(dIn, tIn, ok, no);
}

async function setStatus(id, status, prev) {
  haptic(12);
  await sb.from("appointments").update({ status }).eq("id", id);
  const m = status === "cancelled" ? tr("toastCancelled") : status === "no_show" ? tr("toastNoShow") : status === "attended" ? tr("toastAttended") : tr("toastConfirmed");
  // Undo për veprime të rrezikshme (parandalon humbjen e takimit nga prekje aksidentale)
  const undoable = (status === "cancelled" || status === "no_show") && prev && prev !== status;
  toast(m, null, undoable ? { label: tr("undo"), fn: () => setStatus(id, prev) } : null);
  await renderAll();
}

async function renderBlocks() {
  const list = $("#blockList"); list.innerHTML = "";
  const { data } = await sb.from("time_blocks").select("*").eq("business_id", biz.id)
    .order("block_date").order("from_time");
  const blocks = data || [];
  if (!blocks.length) { list.innerHTML = emptyHTML("⛔", tr("emptyBlock"), tr("emptyBlockHint")); return; }
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

/* ---------------- AI Ekonomisti — këshilla që çojnë te vendime (jo vetëm shifra) ---------------- */
async function renderInsights() {
  const box = $("#insightsBox");
  if (!box || !biz) return;
  let appts = [], orders = [], items = [];
  try { const { data } = await sb.from("appointments").select("appt_date,status,client_name,services(price)").eq("business_id", biz.id); appts = data || []; } catch (e) {}
  try { const { data } = await sb.from("orders").select("*").eq("business_id", biz.id); orders = data || []; } catch (e) {}
  try { const { data } = await sb.from("order_items").select("name,qty,line_total").eq("business_id", biz.id); items = data || []; } catch (e) {}
  const ins = buildInsights(appts, orders, items);
  box.innerHTML = ins.length ? `<div class="ins-h">💡 ${tr("insTitle")}</div>` + ins.slice(0, 6).map(insCard).join("") : "";
  box.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => { const t = document.querySelector('.tab[data-tab="' + b.dataset.go + '"]'); if (t) t.click(); });
  box.querySelectorAll("[data-draft]").forEach((b) => b.onclick = () => openDraft(b.dataset.draft));
}
function insCard(i) {
  return `<div class="ins-card ${i.sev || ""}"><span class="ins-ic">${i.icon}</span>
    <div class="ins-body"><div class="ins-t">${i.title}</div><div class="ins-m">${i.msg}</div></div>
    <div class="ins-actions">
      ${i.draft ? `<button class="btn small primary ins-go" data-draft="${i.draft}">✍️ ${tr("draftBtn")}</button>` : ""}
      ${i.tab ? `<button class="btn small ${i.sev === "warn" && !i.draft ? "primary" : ""} ins-go" data-go="${i.tab}">${tr("insGo")}</button>` : ""}
    </div></div>`;
}
// AI Manager (agjentik-lite): harton mesazhin gati për dërgim
function openDraft(kind) {
  const key = kind === "payment" ? "paymentMsg" : "winbackMsg";
  $("#draftText").value = tr(key).replace("{biz}", biz.name);
  $("#draftModal").hidden = false;
  setTimeout(() => { $("#draftText").focus(); $("#draftText").select(); }, 60);
}
function buildInsights(appts, orders, items) {
  const out = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const activeAppts = appts.filter((a) => a.status !== "cancelled");
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  // Para për t'u arkëtuar
  const outstanding = activeOrders.reduce((s, o) => s + Math.max(0, (Number(o.total) || 0) - (Number(o.amount_paid) || 0)), 0);
  const unpaidN = activeOrders.filter((o) => (Number(o.total) || 0) > (Number(o.amount_paid) || 0)).length;
  if (outstanding > 0) out.push({ impact: outstanding, icon: "💰", sev: "warn", title: tr("insUnpaidT"), msg: tr("insUnpaidM").replace("{a}", money(outstanding)).replace("{n}", unpaidN), tab: "orders", draft: "payment" });
  // Stok i ulët
  const low = services.filter((s) => s.track_stock && Number(s.stock) <= 3);
  if (low.length) out.push({ impact: 60, icon: "📦", sev: "warn", title: tr("insStockT"), msg: tr("insStockM").replace("{items}", low.map((s) => esc(s.name) + " (" + (s.stock != null ? s.stock : 0) + ")").join(", ")), tab: "catalog" });
  // Klientë që po ikin
  const last = {};
  activeAppts.forEach((a) => { const d = a.appt_date; const k = a.client_name; if (k && (!last[k] || d > last[k])) last[k] = d; });
  activeOrders.forEach((o) => { const d = (o.placed_at || "").slice(0, 10); const k = o.customer_name; if (k && (!last[k] || d > last[k])) last[k] = d; });
  const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 45);
  const cutoffS = fmtDate(cutoff);
  const churn = Object.entries(last).filter(([k, d]) => k && k !== "Web" && d < cutoffS).length;
  if (churn >= 2) out.push({ impact: 40 * churn, icon: "👋", sev: "", title: tr("insChurnT"), msg: tr("insChurnM").replace("{n}", churn), tab: "customers", draft: "winback" });
  // Anulime të larta
  const cancN = appts.length - activeAppts.length;
  if (appts.length >= 5 && cancN / appts.length >= 0.2) out.push({ impact: 35, icon: "⚠️", sev: "warn", title: tr("insCancelT"), msg: tr("insCancelM").replace("{p}", Math.round(cancN / appts.length * 100)), tab: "settings" });
  // Më fitimprurësi
  const earn = {};
  items.forEach((i) => { const k = i.name || "—"; earn[k] = (earn[k] || 0) + (Number(i.line_total) || 0); });
  const topE = Object.entries(earn).sort((a, b) => b[1] - a[1])[0];
  if (topE && topE[1] > 0) out.push({ impact: 25, icon: "🏆", sev: "", title: tr("insTopT"), msg: tr("insTopM").replace("{name}", esc(topE[0])).replace("{a}", money(topE[1])), tab: "reports" });
  // Nudges (setup)
  if (!biz.telegram_token) out.push({ impact: 12, icon: "🔗", sev: "", title: tr("insChannelT"), msg: tr("insChannelM"), tab: "settings" });
  out.push({ impact: 6, icon: "🌐", sev: "", title: tr("insPubT"), msg: tr("insPubM"), tab: "settings" });
  return out.sort((a, b) => b.impact - a.impact);
}

// "Sot" — karta e parë që sheh pronari në telefon: kush vjen sot, tjetri, sa para sot
function renderTodayGlance(appts) {
  const box = $("#todayBox"); if (!box) return;
  if ((biz.mode || "appointments") === "inquiry") { box.innerHTML = ""; return; }
  const todayStr = fmtDate(new Date());
  const t = appts.filter((a) => a.appt_date === todayStr && a.status !== "cancelled")
    .sort((a, b) => hm(a.appt_time).localeCompare(hm(b.appt_time)));
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const nextIdx = t.findIndex((a) => toMin(hm(a.appt_time)) >= nowM && a.status !== "no_show" && a.status !== "attended");
  const d = new Date();
  const dateLbl = `${T[lang].dayNames[d.getDay()]}, ${d.getDate()} ${T[lang].months[d.getMonth()]}`;
  const todRev = t.reduce((s, a) => s + (a.services ? Number(a.services.price) || 0 : 0), 0);
  let inner = `<div class="today-head"><div><div class="today-t">${greetWord()} 👋</div><div class="today-d">${tr("todayTitle")} · ${dateLbl}</div></div>`
    + `<div class="today-sum"><b>${t.length}</b> ${tr("todayAppts")}${todRev ? ` · ${money(todRev)}` : ""}</div></div>`;
  if (!t.length) {
    inner += `<div class="today-empty">${tr("todayEmpty")}</div>`;
  } else {
    inner += `<div class="today-list">` + t.map((a, i) => {
      const nm = a.services ? a.services.name : "";
      const passed = toMin(hm(a.appt_time)) <= nowM;
      const actionable = passed && (a.status === "pending" || a.status === "confirmed");
      let right;
      if (actionable) {  // takim që kaloi sot e pa shënuar → shëno direkt nga kreu
        right = `<span class="tr-acts">
          <button class="ta-btn ok" data-id="${a.id}" data-act="attended" data-prev="${a.status}" aria-label="${tr("attendedBtn")}">✓</button>
          <button class="ta-btn no" data-id="${a.id}" data-act="no_show" data-prev="${a.status}" aria-label="${tr("noShowBtn")}">✘</button></span>`;
      } else if (i === nextIdx) {
        right = `<span class="tr-next">${tr("todayNext")}</span>`;
      } else {
        right = a.status === "no_show" ? `<span class="tr-st no">${tr("noShowW")}</span>`
          : a.status === "attended" ? `<span class="tr-st ok">${tr("attendedW")}</span>`
          : a.status === "confirmed" ? `<span class="tr-st ok">${tr("confirmedW")}</span>` : "";
      }
      return `<div class="today-row${i === nextIdx ? " next" : ""}">
        <span class="tr-time">${hm(a.appt_time)}</span>
        <span class="tr-who"><strong>${esc(a.client_name || tr("noName"))}</strong>${nm ? `<small>${esc(nm)}</small>` : ""}</span>
        ${right}</div>`;
    }).join("") + `</div>`;
  }
  box.innerHTML = `<div class="today-card">${inner}</div>`;
  const card = box.querySelector(".today-card");
  if (card) card.onclick = () => { const tab = document.querySelector('.tab[data-tab="appointments"]'); if (tab) tab.click(); };
  // Veprime inline (mos lejo që klikimi i butonit të hapë skedën Takimet)
  box.querySelectorAll(".ta-btn").forEach((b) => b.onclick = (e) => { e.stopPropagation(); setStatus(b.dataset.id, b.dataset.act, b.dataset.prev); });
}

async function renderStats() {
  renderInsights();
  const sg0 = $("#statsGrid"); if (sg0) sg0.innerHTML = skel(4);   // skeleton gjatë ngarkimit
  const tb0 = $("#todayBox"); if (tb0 && (biz.mode || "appointments") !== "inquiry") tb0.innerHTML = skel(2);
  // Marrim çdo takim me emrin/çmimin e shërbimit (edhe nëse shërbimi është çaktivizuar)
  const { data } = await sb.from("appointments")
    .select("appt_date, appt_time, status, source, client_name, services(name, price, duration_min, cost)")
    .eq("business_id", biz.id);
  const appts = data || [];
  const grid = $("#statsGrid");

  // ---- "SOT" — pamja e shpejtë (UX mobile: hap app → sheh sot menjëherë) ----
  renderTodayGlance(appts);

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

  // ----- Kapaciteti i mbushur + fitimi/orë (këtë muaj) -----
  const staffCount = Math.max(1, staff.length);
  const breakMinFor = (dow) => breaksFor(dow).reduce((a, [s, e]) => a + (e - s), 0);
  const dailyCap = (dow) => { const h = hours[dow]; if (!h) return 0; return Math.max(0, (toMin(h.close) - toMin(h.open)) - breakMinFor(dow)) * staffCount; };
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let capAvail = 0;
  for (let day = 1; day <= dim; day++) capAvail += dailyCap(new Date(now.getFullYear(), now.getMonth(), day).getDay());
  let bookedMin = 0, cogsM = 0;
  for (const a of active) if (ym(parseDate(a.appt_date)) === thisYM) {
    bookedMin += (a.services && a.services.duration_min) ? Number(a.services.duration_min) : 30;
    cogsM += (a.services && a.services.cost != null) ? Number(a.services.cost) : 0;
  }
  const utilPct = capAvail > 0 ? Math.round(bookedMin / capAvail * 100) : 0;
  const bookedHours = bookedMin / 60;
  const netM = round2(revThis - cogsM - fixedMonthlyTotal());
  const profitPerHour = bookedHours > 0 ? round2(netM / bookedHours) : 0;

  // ----- Norma e anulimeve + mungesat (no-show) -----
  const cancelled = appts.filter((a) => a.status === "cancelled").length;
  const cancelRate = appts.length ? Math.round((cancelled / appts.length) * 100) : 0;
  const noShows = appts.filter((a) => a.status === "no_show").length;

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
        <div class="num">${money(revThis)}</div>
        <div class="lbl">${tr("statThisMonth")}</div>
        ${trendHtml || `<span class="trend muted">${tr("statVsLast")}: ${money(revLast)}</span>`}
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

    <div class="stats-grid">
      <div class="stat-card ${utilPct >= 70 ? "highlight" : (capAvail > 0 && utilPct < 30 ? "warn" : "")}">
        <div class="num">${capAvail > 0 ? utilPct + "%" : "—"}</div>
        <div class="lbl">${tr("statCapacity")}</div>
      </div>
      ${profitOn() ? `<div class="stat-card"><div class="num">${money(profitPerHour)}</div><div class="lbl">${tr("statProfitHour")}</div></div>` : ""}
      ${noShows > 0 ? `<div class="stat-card warn"><div class="num">${noShows}</div><div class="lbl">${tr("statNoShows")}</div></div>` : ""}
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
  $("#manService").innerHTML = services.filter((s) => s.bookable !== false).map((s) => `<option value="${s.id}">${esc(s.name)} (${s.duration_min} min)</option>`).join("");
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
  const baseRow = {
    business_id: biz.id, service_id: $("#manService").value,
    client_name: client, appt_time: time, status: "pending", source: "manual",
  };
  // Vendos staf vetëm kur ka staf (enterprise.sql i ekzekutuar)
  if (sid) { baseRow.staff_id = sid; baseRow.location_id = st ? st.location_id : null; }

  const step = parseInt($("#manRepeat") ? $("#manRepeat").value : "0", 10) || 0;
  const times = step ? Math.max(2, Math.min(52, parseInt($("#manTimes").value, 10) || 1)) : 1;
  let created = 0;
  for (let i = 0; i < times; i++) {
    const d = parseDate($("#manDate").value);
    if (step === 30) d.setMonth(d.getMonth() + i); else d.setDate(d.getDate() + step * i);
    const { error } = await sb.from("appointments").insert({ ...baseRow, appt_date: fmtDate(d) });
    if (!error) created++;
  }
  $("#manModal").hidden = true; $("#manClient").value = "";
  if ($("#manRepeat")) $("#manRepeat").value = "0";
  if ($("#manTimesField")) $("#manTimesField").hidden = true;
  toast(step ? tr("recurDone").replace("{n}", created) : tr("toastSaved"));
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
  decorateMenuIcons();
  renderAuthMode();
}

/* Ndan ikonën (emoji) nga teksti te skedat e menusë → ikona në një kuti/rreth qelqi
   (si referenca whygoalbania). Çdo string i18n është "emoji⎵tekst", ndaj e ndajmë te
   hapësira e parë. Thirret pas çdo applyLang (që rivendos textContent). */
function decorateMenuIcons() {
  document.querySelectorAll(".sidebar .tabs .tab").forEach((b) => {
    const txt = b.textContent.trim();
    const sp = txt.indexOf(" ");
    if (sp <= 0) return; // tashmë e ndarë (pa hapësirë) ose pa ikonë
    b.innerHTML = '<span class="tab-ic" aria-hidden="true"></span><span class="tab-lb"></span>';
    b.querySelector(".tab-ic").textContent = txt.slice(0, sp);
    b.querySelector(".tab-lb").textContent = txt.slice(sp + 1);
  });
}

// Aksesueshmëri për modalet: bllokon fokusin brenda + Escape mbyll + kthen fokusin
let _modalReturnFocus = null;
function setupModalA11y() {
  document.addEventListener("focusin", (e) => {
    if (!document.querySelector(".modal-backdrop:not([hidden])") && e.target) _modalReturnFocus = e.target;
  });
  document.addEventListener("keydown", (e) => {
    const modal = [...document.querySelectorAll(".modal-backdrop")].find((m) => !m.hidden);
    if (!modal) return;
    if (e.key === "Escape") {
      e.preventDefault();
      const cancel = modal.querySelector('[id$="Cancel"], .modal-cancel, [data-t="cancel"]');
      if (cancel) cancel.click(); else modal.hidden = true;
      if (_modalReturnFocus && _modalReturnFocus.focus) setTimeout(() => _modalReturnFocus.focus(), 0);
      return;
    }
    if (e.key === "Tab") {
      const list = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

// Butonat "i": kliko → shfaq një shpjegim të vogël (popover) pranë tyre; kliko jashtë → mbyll
function setupInfoDots() {
  let pop = null;
  const close = () => { if (pop) { pop.remove(); pop = null; } };
  document.addEventListener("click", (e) => {
    const dot = e.target.closest(".info-dot");
    if (!dot) { close(); return; }
    e.preventDefault(); e.stopPropagation();
    const reopen = pop && pop._for === dot;
    close();
    if (reopen) return;
    pop = document.createElement("div");
    pop.className = "info-pop"; pop._for = dot;
    pop.textContent = tr(dot.dataset.info) || dot.dataset.info || "";
    document.body.appendChild(pop);
    const r = dot.getBoundingClientRect();
    const w = Math.min(260, window.innerWidth - 24);
    pop.style.width = w + "px";
    let left = window.scrollX + r.left + r.width / 2 - w / 2;
    left = Math.max(window.scrollX + 12, Math.min(left, window.scrollX + window.innerWidth - w - 12));
    pop.style.left = left + "px";
    pop.style.top = (window.scrollY + r.bottom + 9) + "px";
  });
  window.addEventListener("resize", close);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

// Navigimi për telefon: bar poshtë (bottom-nav) + sirtar "Më shumë"
function closeSidebarDrawer() {
  const s = document.querySelector(".sidebar"); if (s) s.classList.remove("open");
  const b = $("#sidebarBackdrop"); if (b) b.hidden = true;
  document.body.classList.remove("menu-open");
}
function syncBotnav() {
  const active = document.querySelector(".tab.active");
  const cur = active ? active.dataset.tab : "";
  const primary = ["stats", "calendar", "appointments", "reports"];
  document.querySelectorAll("#botnav button[data-go]").forEach((b) => { const on = b.dataset.go === cur; b.classList.toggle("active", on); b.setAttribute("aria-current", on ? "page" : "false"); });
  const more = $("#botMore"); if (more) more.classList.toggle("active", !primary.includes(cur));
}
function setupMobileNav() {
  document.querySelectorAll("#botnav button[data-go]").forEach((b) => {
    b.onclick = () => { haptic(); const t = document.querySelector('.tab[data-tab="' + b.dataset.go + '"]'); if (t) t.click(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  });
  const more = $("#botMore");
  if (more) more.onclick = () => { const s = document.querySelector(".sidebar"); if (!s) return; const open = !s.classList.contains("open"); s.classList.toggle("open", open); document.body.classList.toggle("menu-open", open); const b = $("#sidebarBackdrop"); if (b) b.hidden = !open; };
  const cl = $("#sidebarClose"); if (cl) cl.onclick = closeSidebarDrawer;
  const bd = $("#sidebarBackdrop"); if (bd) bd.onclick = closeSidebarDrawer;
  const fab = $("#fab"); if (fab) fab.onclick = () => {
    haptic(12);
    const cur = (document.querySelector(".tab.active") || {}).dataset ? document.querySelector(".tab.active").dataset.tab : "";
    if (cur === "catalog") openItem(null);                 // FAB kontekstual: veprimi i duhur sipas skedës
    else if (cur === "orders") openOrder(null);
    else if (biz && biz.mode === "inquiry") openOrder(null);
    else openManual();
  };
  syncBotnav();
}

function wire() {
  setupModalA11y();
  setupInfoDots();
  setupMobileNav();
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
    } catch (ex) { errToast(ex); }
  };
  const anBtn = $("#saveAiNotes");
  if (anBtn) anBtn.onclick = async () => {
    const v = $("#aiNotes").value.trim();
    try {
      await sb.from("businesses").update({ ai_notes: v || null }).eq("id", biz.id);
      biz.ai_notes = v || null;
      toast(tr("toastSaved"));
    } catch (ex) { errToast(ex); }
  };
  // (Mënyra, emri/adresa, tregtia ruhen tani me një buton të vetëm "Ruaj gjithçka" te General → #saveGeneral)
  if ($("#custSearch")) $("#custSearch").oninput = renderCustomers;
  const tgBtn = $("#saveTgToken");
  if (tgBtn) tgBtn.onclick = async () => {
    const t = $("#tgToken").value.trim();
    try {
      await sb.from("businesses").update({ telegram_token: t || null }).eq("id", biz.id);
      biz.telegram_token = t || null;
      updateTgWebhookLink();
      toast(tr("toastSaved"));
    } catch (ex) { errToast(ex); }
  };
  if ($("#tgToken")) $("#tgToken").oninput = updateTgWebhookLink;
  if ($("#profitOnChk")) $("#profitOnChk").onchange = (e) => { const f = $("#fixedCostField"); if (f) f.hidden = !e.target.checked; };
  if ($("#addFixedCost")) $("#addFixedCost").onclick = () => { addFixedCostRow("", ""); const rows = document.querySelectorAll("#fixedCostList .exp-row"); const last = rows[rows.length - 1]; if (last) last.querySelector(".exp-name").focus(); };
  // General: ruaj GJITHÇKA me një buton
  if ($("#saveGeneral")) $("#saveGeneral").onclick = async () => {
    const cfg = Object.assign({}, biz.config || {});
    const g = (id) => ($(id) ? $(id).value.trim() || null : null);
    cfg.phone = g("#bizPhone"); cfg.email = g("#bizEmail"); cfg.website = g("#bizWebsite");
    cfg.instagram = g("#bizInstagram"); cfg.city = g("#bizCity"); cfg.about = g("#bizAbout");
    cfg.profitOn = $("#profitOnChk") ? $("#profitOnChk").checked : false;
    cfg.fixedCosts = collectFixedCosts();
    cfg.fixedMonthly = cfg.fixedCosts.reduce((a, x) => a + (Number(x.amount) || 0), 0) || null; // përputhshmëri
    const payload = {
      name: ($("#setName").value.trim() || biz.name),
      address: g("#setAddress"),
      mode: $("#bizMode").value,
      currency: $("#bizCurrency").value,
      commerce_enabled: $("#commerceOn").checked,
      config: cfg,
    };
    try {
      await sb.from("businesses").update(payload).eq("id", biz.id);
      Object.assign(biz, payload);
      $("#bizName").textContent = tr("panelPrefix") + biz.name;
      renderBizSwitch();
      applyModeUI(); renderCatalog(); if (commerceOn()) renderOrders();
      renderSettings(); await renderAll();
      toast(tr("toastSaved"));
    } catch (ex) { errToast(ex); }
  };
  // Fshirja e biznesit (me verifikim: shkruaj emrin + konfirmim)
  if ($("#btnDeleteBiz")) $("#btnDeleteBiz").onclick = openDeleteBiz;
  if ($("#delBizName")) $("#delBizName").oninput = delBizCheck;
  if ($("#delBizHuman")) $("#delBizHuman").onchange = delBizCheck;
  if ($("#delBizGo")) $("#delBizGo").onclick = doDeleteBiz;
  if ($("#delBizCancel")) $("#delBizCancel").onclick = () => { $("#deleteBizModal").hidden = true; };
  if ($("#deleteBizModal")) $("#deleteBizModal").addEventListener("click", (e) => { if (e.target === $("#deleteBizModal")) $("#deleteBizModal").hidden = true; });
  if ($("#addTeam")) $("#addTeam").onclick = async () => {
    const email = ($("#teamEmail").value || "").trim().toLowerCase();
    if (!email || !/.+@.+\..+/.test(email)) { $("#teamEmail").focus(); return; }
    try {
      await sb.from("team_members").insert({ business_id: biz.id, email, role: $("#teamRole").value });
      $("#teamEmail").value = ""; renderTeam(); toast(tr("toastSaved"));
    } catch (ex) { errToast(ex); }
  };
  if ($("#copyPubLink")) $("#copyPubLink").onclick = async () => {
    const v = $("#pubLink").value;
    try { await navigator.clipboard.writeText(v); toast(tr("copied")); }
    catch (e) { $("#pubLink").select(); document.execCommand && document.execCommand("copy"); toast(tr("copied")); }
  };
  // Përshtatja: fik/ndiz fushat e katalogut
  if ($("#saveFields")) $("#saveFields").onclick = async () => {
    const cfg = Object.assign({}, biz.config || {});
    cfg.catDesc = $("#cfgDesc").checked; cfg.catUnit = $("#cfgUnit").checked;
    cfg.catStock = $("#cfgStock").checked; cfg.catSku = $("#cfgSku").checked; cfg.catTiers = $("#cfgTiers").checked;
    try {
      await sb.from("businesses").update({ config: cfg }).eq("id", biz.id);
      biz.config = cfg; renderCatalog(); toast(tr("toastSaved"));
    } catch (ex) { errToast(ex); }
  };
  if ($("#goCatalog")) $("#goCatalog").onclick = () => { const t = document.querySelector('.tab[data-tab="catalog"]'); if (t) t.click(); };
  // AI Manager: modali i mesazhit të gatshëm
  if ($("#draftClose")) $("#draftClose").onclick = () => { $("#draftModal").hidden = true; };
  if ($("#draftModal")) $("#draftModal").addEventListener("click", (e) => { if (e.target === $("#draftModal")) $("#draftModal").hidden = true; });
  if ($("#draftCopy")) $("#draftCopy").onclick = async () => {
    const v = $("#draftText").value;
    try { await navigator.clipboard.writeText(v); toast(tr("copied")); }
    catch (e) { $("#draftText").select(); document.execCommand && document.execCommand("copy"); toast(tr("copied")); }
  };
  // Katalogu: editori i artikullit
  if ($("#btnAddItem")) $("#btnAddItem").onclick = () => openItem(null);
  if ($("#addTier")) $("#addTier").onclick = () => addTierRow();
  if ($("#addAddon")) $("#addAddon").onclick = () => { addAddonRow("", "", "", false); const rows = document.querySelectorAll("#itemAddons .addon-row"); const last = rows[rows.length - 1]; if (last) last.querySelector(".a-name").focus(); };
  if ($("#itemSave")) $("#itemSave").onclick = saveItem;
  if ($("#itemDelete")) $("#itemDelete").onclick = deleteItem;
  if ($("#itemCancel")) $("#itemCancel").onclick = () => { $("#itemModal").hidden = true; };
  if ($("#itemModal")) $("#itemModal").addEventListener("click", (e) => { if (e.target === $("#itemModal")) $("#itemModal").hidden = true; });
  // Multi-business
  if ($("#bizSwitch")) $("#bizSwitch").onchange = (e) => switchBusiness(e.target.value);
  if ($("#btnAddBiz")) $("#btnAddBiz").onclick = addNewBusiness;
  if ($("#obBack")) $("#obBack").onclick = () => { addingBiz = false; if (biz) { renderBizSwitch(); showView("app"); } };
  // Porositë
  if ($("#btnAddOrder")) $("#btnAddOrder").onclick = () => openOrder(null);
  if ($("#orderFilter")) $("#orderFilter").onchange = renderOrders;
  if ($("#addOrderLine")) $("#addOrderLine").onclick = () => addOrderLine();
  if ($("#orderDiscount")) $("#orderDiscount").oninput = recomputeOrder;
  if ($("#orderSave")) $("#orderSave").onclick = saveOrder;
  if ($("#orderDelete")) $("#orderDelete").onclick = deleteOrder;
  if ($("#orderPrint")) $("#orderPrint").onclick = printInvoice;
  if ($("#orderCancel")) $("#orderCancel").onclick = () => { $("#orderModal").hidden = true; };
  if ($("#orderModal")) $("#orderModal").addEventListener("click", (e) => { if (e.target === $("#orderModal")) $("#orderModal").hidden = true; });
  if ($("#saveHours")) $("#saveHours").onclick = saveHoursEdit;
  $("#calPrev").onclick = () => { const d = parseDate(calDate); d.setDate(d.getDate() - 1); calDate = fmtDate(d); renderCalendar(); };
  $("#calNext").onclick = () => { const d = parseDate(calDate); d.setDate(d.getDate() + 1); calDate = fmtDate(d); renderCalendar(); };
  $("#calToday").onclick = () => { calDate = fmtDate(new Date()); renderCalendar(); };
  $("#btnAddAppt").onclick = openManual;
  $("#manService").onchange = refreshManTimes;
  $("#manDate").onchange = refreshManTimes;
  if ($("#manStaff")) $("#manStaff").onchange = refreshManTimes;
  if ($("#calStaff")) $("#calStaff").onchange = (e) => { calStaff = e.target.value || null; renderCalendar(); };
  if ($("#manRepeat")) $("#manRepeat").onchange = (e) => { if ($("#manTimesField")) $("#manTimesField").hidden = e.target.value === "0"; };
  $("#manCancel").onclick = () => { $("#manModal").hidden = true; };
  $("#manSave").onclick = saveManual;
  $("#manModal").addEventListener("click", (e) => { if (e.target === $("#manModal")) $("#manModal").hidden = true; });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#manModal").hidden) $("#manModal").hidden = true;
    if ($("#itemModal") && !$("#itemModal").hidden) $("#itemModal").hidden = true;
    if ($("#orderModal") && !$("#orderModal").hidden) $("#orderModal").hidden = true;
    if ($("#draftModal") && !$("#draftModal").hidden) $("#draftModal").hidden = true;
    if ($("#deleteBizModal") && !$("#deleteBizModal").hidden) $("#deleteBizModal").hidden = true;
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((x) => x.classList.remove("active"));
      tab.classList.add("active");
      $("#pane-" + tab.dataset.tab).classList.add("active");
      // Render lazy për skedat e tregtisë (gjithmonë të freskëta kur i hap)
      if (tab.dataset.tab === "orders") renderOrders();
      else if (tab.dataset.tab === "reports") renderReports();
      else if (tab.dataset.tab === "catalog") renderCatalog();
      else if (tab.dataset.tab === "config") renderConfigHub();
      closeSidebarDrawer(); syncBotnav(); // sirtar i telefonit + sinkronizim i barit poshtë
    };
  });
  if ($("#aiForm")) $("#aiForm").addEventListener("submit", (e) => { e.preventDefault(); aiSend(); });
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
    if (error) { errToast(error); return; }
    e.target.reset(); await loadLocations(); setupStaffUI(); renderStaffPane(); toast(tr("toastSaved"));
  });
  if ($("#staffForm")) $("#staffForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#staffName").value.trim(); if (!name) return;
    const { error } = await sb.from("staff").insert({
      business_id: biz.id, name, role: $("#staffRole").value.trim() || "staff",
      location_id: $("#staffLoc").value || null, sort_order: staff.length,
    });
    if (error) { errToast(error); return; }
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
