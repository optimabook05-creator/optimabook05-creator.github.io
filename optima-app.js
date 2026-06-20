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
    qsTitle: "Fillimi i shpejtë", qsSub: "Pak hapa dhe AI yt është gati të presë klientë.",
    qsDoneTitle: "Gati! 🎉", qsDoneSub: "AI yt po pret klientë 24/7. Mund ta mbyllësh këtë.",
    qsSvc: "Shto shërbimet e tua", qsHrs: "Vendos orarin e punës",
    qsChan: "Lidh kanalin (WhatsApp/Telegram)", qsMsg: "Merr mesazhin e parë të klientit",
    qsDo: "Bëje", qsHow: "Si?",
    qsMsgHelp: "Lidh kanalin te Cilësimet, pastaj dërgo një mesazh provë vetë — do ta shohësh këtu të kryer.",
    emptyApptHint: "Sapo një klient të rezervojë (ose shto një manualisht), takimi shfaqet këtu.",
    emptyWaitHint: "Kur një orar është plot, AI i shton klientët këtu dhe i lajmëron kur lirohet.",
    emptyLeadsHint: "Çdo kërkesë/porosi që AI merr nga klientët do të mblidhet këtu.",
    emptyCustomersHint: "AI i ndërton vetë profilet e klientëve nga bisedat — vizita, shpenzime, kanal.",
    emptyActivityHint: "Çdo veprim i AI-së (rezervime, anulime, kujtesa) shfaqet këtu në kohë reale.",
    emptyBlockHint: "Blloko orare kur s'punon (pushime, dreka) që AI të mos rezervojë atëherë.",
    tabCatalog: "📦 Katalogu", catalogDesc: "Produktet dhe shërbimet e tua — çmim, stok, njësi dhe çmime sipas sasisë (shumicë/pakicë).",
    addItem: "+ Shto artikull", emptyCatalog: "Ende pa artikuj.", emptyCatalogHint: "Shembull: 'Parfum 199ml' → Produkt, çmimi 45, dhe çmime shumice: nga 2 → 40, nga 100 → 12.",
    itemNew: "Artikull i ri", itemEdit: "Ndrysho artikullin", itemName: "Emri", itemNamePh: "p.sh. Parfum 'Tobako Mix'", itemKind: "Lloji",
    itemDesc: "Përshkrimi (detaje për klientin & AI-në)", itemDescPh: "p.sh. 199 ml · erë e fortë · mix kanellë–limon–tobako",
    kindService: "Shërbim", kindProduct: "Produkt / mall", itemPrice: "Çmimi për 1 (bazë)", itemUnit: "Njësia", itemUnitPh: "copë, shishe, kg, m…",
    itemTrack: "Ndiq stokun", itemStock: "Sasia në stok", itemSku: "Kodi (SKU, opsional)",
    itemTiers: "Çmime sipas sasisë (shumicë) — opsionale", tiersHint: "Shkruaj nga sa copë dhe çmimin. P.sh. nga 2 → 40, nga 100 → 12. Aplikohet vetë sipas sasisë.",
    addTier: "+ Shkallë çmimi", tierQty: "Nga sa copë", tierPrice: "Çmimi për copë", stockLbl: "Stok", hasTiers: "💹 shumicë",
    commerceLbl: "🛒 Tregti (produkte, porosi, raporte) & monedha", commerceOnLbl: "Aktivizo katalogun, porositë & raportet",
    delete: "Fshi", confirmDelete: "Ta fshij këtë? S'kthehet mbrapsht.",
    tabOrders: "🧾 Porositë", tabReports: "📈 Raporte",
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
    reportsDesc: "Raport shitjesh: sa u shit, çfarë, te kush — sipas periudhës që zgjedh.",
    rep_today: "Sot", rep_week: "7 ditë", rep_month: "Këtë muaj", rep_lastMonth: "Muaji i kaluar", rep_year: "Këtë vit", rep_custom: "Periudhë", apply: "Apliko",
    repNoData: "Pa shitje në këtë periudhë.", repNoDataHint: "Kur të regjistrosh porosi në këtë periudhë, raporti shfaqet këtu.",
    repRevenue: "Të ardhura", repOrders: "Porosi", repUnits: "Njësi të shitura",
    repPaid: "Të arkëtuara", repOutstanding: "Për t'u arkëtuar", repRetail: "Pakicë", repWholesale: "Shumicë",
    repTopProducts: "Më të shiturat", repTopCustomers: "Klientët kryesorë",
    addBiz: "+ Biznes", obBack: "← Kthehu",
    setFieldsH: "🧩 Fushat e katalogut (fik ato që s'të duhen)", fieldsDesc: "Çdo gjë është ndezur si parazgjedhje. Fik çfarë s'të duhet — paneli bëhet vetëm i yti.",
    cfgDescLbl: "Përshkrimi", cfgUnitLbl: "Njësia", cfgStockLbl: "Stoku", cfgSkuLbl: "Kodi (SKU)", cfgTiersLbl: "Çmime shumice",
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
    qsTitle: "Quick start", qsSub: "A few steps and your AI is ready to welcome customers.",
    qsDoneTitle: "All set! 🎉", qsDoneSub: "Your AI is serving customers 24/7. You can close this.",
    qsSvc: "Add your services", qsHrs: "Set your working hours",
    qsChan: "Connect a channel (WhatsApp/Telegram)", qsMsg: "Get your first customer message",
    qsDo: "Do it", qsHow: "How?",
    qsMsgHelp: "Connect a channel in Settings, then send a test message yourself — you'll see this checked off.",
    emptyApptHint: "As soon as a customer books (or you add one manually), the appointment shows up here.",
    emptyWaitHint: "When a slot is full, the AI adds customers here and notifies them when it frees up.",
    emptyLeadsHint: "Every request/order the AI receives from customers will be collected here.",
    emptyCustomersHint: "The AI builds customer profiles automatically from chats — visits, spend, channel.",
    emptyActivityHint: "Every AI action (bookings, cancellations, reminders) appears here in real time.",
    emptyBlockHint: "Block off times when you're closed (holidays, lunch) so the AI won't book then.",
    tabCatalog: "📦 Catalog", catalogDesc: "Your products and services — price, stock, unit and quantity pricing (wholesale/retail).",
    addItem: "+ Add item", emptyCatalog: "No items yet.", emptyCatalogHint: "Example: 'Perfume 199ml' → Product, price 45, plus wholesale tiers: from 2 → 40, from 100 → 12.",
    itemNew: "New item", itemEdit: "Edit item", itemName: "Name", itemNamePh: "e.g. Perfume 'Tobacco Mix'", itemKind: "Type",
    itemDesc: "Description (details for customer & AI)", itemDescPh: "e.g. 199 ml · strong scent · cinnamon–lemon–tobacco mix",
    kindService: "Service", kindProduct: "Product / goods", itemPrice: "Price for 1 (base)", itemUnit: "Unit", itemUnitPh: "pc, bottle, kg, m…",
    itemTrack: "Track stock", itemStock: "Stock quantity", itemSku: "Code (SKU, optional)",
    itemTiers: "Quantity pricing (wholesale) — optional", tiersHint: "Enter from how many and the price. E.g. from 2 → 40, from 100 → 12. Applied automatically by quantity.",
    addTier: "+ Price tier", tierQty: "From qty", tierPrice: "Price each", stockLbl: "Stock", hasTiers: "💹 wholesale",
    commerceLbl: "🛒 Commerce (products, orders, reports) & currency", commerceOnLbl: "Enable catalog, orders & reports",
    delete: "Delete", confirmDelete: "Delete this? This cannot be undone.",
    tabOrders: "🧾 Orders", tabReports: "📈 Reports",
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
    reportsDesc: "Sales report: how much you sold, what, to whom — for the period you pick.",
    rep_today: "Today", rep_week: "7 days", rep_month: "This month", rep_lastMonth: "Last month", rep_year: "This year", rep_custom: "Custom", apply: "Apply",
    repNoData: "No sales in this period.", repNoDataHint: "Once you record orders in this period, the report shows up here.",
    repRevenue: "Revenue", repOrders: "Orders", repUnits: "Units sold",
    repPaid: "Collected", repOutstanding: "Outstanding", repRetail: "Retail", repWholesale: "Wholesale",
    repTopProducts: "Best sellers", repTopCustomers: "Top customers",
    addBiz: "+ Business", obBack: "← Back",
    setFieldsH: "🧩 Catalog fields (turn off what you don't need)", fieldsDesc: "Everything is on by default. Turn off what you don't need — the panel becomes truly yours.",
    cfgDescLbl: "Description", cfgUnitLbl: "Unit", cfgStockLbl: "Stock", cfgSkuLbl: "Code (SKU)", cfgTiersLbl: "Wholesale pricing",
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

// Monedha (global) — simboli sipas biznesit
const CUR_SYM = { EUR:"€", USD:"$", GBP:"£", ALL:"L", CHF:"CHF", CAD:"$", AUD:"$", AED:"AED", TRY:"₺", RSD:"din", MKD:"den", RON:"lei", BGN:"лв", SEK:"kr", INR:"₹", JPY:"¥", CNY:"¥" };
function curSym() { return CUR_SYM[(biz && biz.currency) || "EUR"] || ((biz && biz.currency) || "€"); }
function money(n) { const v = Math.round((Number(n) || 0) * 100) / 100; const s = curSym(); return s.length === 1 ? `${v}${s}` : `${v} ${s}`; }
// A shfaqet një fushë e katalogut? (pronari mund të fikë çdo fushë; default = shfaqet)
function showField(key) { return !(biz && biz.config && biz.config[key] === false); }

// Çmimi/njësi sipas sasisë: zgjedh shkallën më të mirë (min_qty më e madhe <= qty), përndryshe çmimi bazë
function unitPriceFor(item, qty) {
  let best = Number(item.price) || 0;
  let bestQ = -1;
  for (const t of priceTiers) {
    if (t.service_id === item.id && Number(t.min_qty) <= qty && Number(t.min_qty) > bestQ) {
      best = Number(t.unit_price) || 0; bestQ = Number(t.min_qty);
    }
  }
  return best;
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
  if (biz.commerce_enabled) renderOrders();
  renderQuickStart();
}

// Kartë "Fillimi i shpejtë" — udhëheq pronarin, zbulon vetë çfarë është bërë
async function renderQuickStart() {
  const box = $("#quickStart");
  if (!box || !biz) return;
  if (localStorage.getItem("ob-qs-dismissed-" + biz.id)) { box.hidden = true; return; }
  const inquiry = biz.mode === "inquiry";

  // A ka marrë mesazhin e parë? (sinjal real që kanali punon)
  let gotMsg = false;
  try {
    const { count } = await sb.from("messages").select("id", { count: "exact", head: true }).eq("business_id", biz.id);
    gotMsg = (count || 0) > 0;
  } catch (e) {}

  const items = [];
  items.push({ key: "svc", done: services.length > 0, label: tr("qsSvc"), tab: "settings" });
  if (!inquiry) items.push({ key: "hrs", done: Object.values(hours).some((h) => h), label: tr("qsHrs"), tab: "settings" });
  items.push({ key: "chan", done: !!biz.telegram_token, label: tr("qsChan"), tab: "settings" });
  items.push({ key: "msg", done: gotMsg, label: tr("qsMsg"), tab: "settings" });

  const doneN = items.filter((i) => i.done).length;
  const allDone = doneN === items.length;
  $("#qsFill").style.width = Math.round((doneN / items.length) * 100) + "%";
  $("#qsTitleTxt").textContent = allDone ? tr("qsDoneTitle") : tr("qsTitle");
  $("#qsSub").textContent = allDone ? tr("qsDoneSub") : tr("qsSub");

  const list = $("#qsList");
  list.innerHTML = "";
  items.forEach((it) => {
    const row = document.createElement("div");
    row.className = "qs-item" + (it.done ? " done" : "");
    const tick = document.createElement("span");
    tick.className = "qs-tick"; tick.textContent = it.done ? "✓" : "";
    const lab = document.createElement("span");
    lab.className = "qs-lab"; lab.textContent = it.label;
    row.appendChild(tick); row.appendChild(lab);
    if (!it.done) {
      const act = document.createElement("button");
      act.className = "btn small primary qs-go"; act.type = "button";
      act.textContent = it.key === "msg" ? tr("qsHow") : tr("qsDo");
      act.onclick = () => {
        const t = document.querySelector('.tab[data-tab="' + it.tab + '"]');
        if (t) t.click();
        if (it.key === "msg") toast(tr("qsMsgHelp"));
        box.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      row.appendChild(act);
    }
    list.appendChild(row);
  });

  $("#qsDismiss").onclick = () => {
    try { localStorage.setItem("ob-qs-dismissed-" + biz.id, "1"); } catch (e) {}
    box.hidden = true;
  };
  box.hidden = false;
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
    if (showField("catUnit") && s.unit_label) meta.push(esc(s.unit_label));
    if (showField("catStock") && s.track_stock) {
      const low = Number(s.stock) <= 3;
      meta.push(`<span class="stock-badge ${low ? "low" : ""}">${tr("stockLbl")}: ${s.stock != null ? s.stock : 0}</span>`);
    }
    if (showField("catTiers") && tiers.length) meta.push(`💹 ${tiers.map((t) => `${plainNum(t.min_qty)}+ → ${money(t.unit_price)}`).join(", ")}`);
    const desc = (showField("catDesc") && s.description) ? `<div class="cat-desc">${esc(s.description)}</div>` : "";
    const item = document.createElement("div");
    item.className = "cat-item";
    item.innerHTML = `<span class="grow"><div class="cat-name">${esc(s.name)}</div>${desc}<div class="cat-meta">${meta.join(" ")}</div></span><span class="cat-price">${money(s.price)}</span>`;
    item.onclick = () => openItem(s);
    list.appendChild(item);
  });
}

function openItem(s) {
  editingItemId = s ? s.id : null;
  $("#itemTitle").textContent = s ? tr("itemEdit") : tr("itemNew");
  $("#itemName").value = s ? s.name : "";
  $("#itemKind").value = s && s.kind === "product" ? "product" : "service";
  $("#itemDesc").value = s && s.description ? s.description : "";
  $("#itemPrice").value = s ? s.price : 0;
  $("#itemUnit").value = s && s.unit_label ? s.unit_label : "";
  $("#itemTrack").checked = !!(s && s.track_stock);
  $("#itemStock").value = s && s.stock != null ? s.stock : "";
  $("#itemSku").value = s && s.sku ? s.sku : "";
  $("#itemTiers").innerHTML = "";
  (s ? priceTiers.filter((t) => t.service_id === s.id) : []).forEach((t) => addTierRow(t.min_qty, t.unit_price));
  // Fsheh fushat që pronari ka fikur
  if ($("#fldDesc")) $("#fldDesc").hidden = !showField("catDesc");
  if ($("#fldUnit")) $("#fldUnit").hidden = !showField("catUnit");
  if ($("#stockRow")) $("#stockRow").hidden = !showField("catStock");
  if ($("#fldSku")) $("#fldSku").hidden = !showField("catSku");
  if ($("#fldTiers")) $("#fldTiers").hidden = !showField("catTiers");
  $("#itemDelete").hidden = !s;
  $("#itemModal").hidden = false;
  setTimeout(() => $("#itemName").focus(), 60);
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
  const payload = {
    business_id: biz.id, name,
    price: Number($("#itemPrice").value) || 0,
    kind: $("#itemKind").value === "product" ? "product" : "service",
    description: $("#itemDesc").value.trim() || null,
    sku: $("#itemSku").value.trim() || null,
    unit_label: $("#itemUnit").value.trim() || null,
    track_stock: track,
    stock: track ? (Number($("#itemStock").value) || 0) : null,
  };
  try {
    let itemId = editingItemId;
    if (itemId) {
      await sb.from("services").update(payload).eq("id", itemId);
    } else {
      payload.duration_min = 30; payload.active = true;
      const { data, error } = await sb.from("services").insert(payload).select("id").single();
      if (error) throw error;
      itemId = data.id;
    }
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
  } catch (ex) { alert(ex.message || String(ex)); }
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
  } catch (ex) { alert(ex.message || String(ex)); }
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
  if (!list || !biz || !biz.commerce_enabled) return;
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
    const lt = qv * pv;
    r.querySelector(".ol-total").textContent = money(lt);
    sub += lt;
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
    if (sid && qv > 0) lines.push({ service_id: sid, name: (svcById(sid) || {}).name || "", qty: qv, unit_price: pv, line_total: qv * pv });
  });
  if (!lines.length) { toast(tr("orderNeedItem")); return; }
  const sub = lines.reduce((a, l) => a + l.line_total, 0);
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
    subtotal: sub, discount: disc, total: Math.max(0, sub - disc),
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
    const items = lines.map((l) => ({ order_id: oid, business_id: biz.id, service_id: l.service_id, name: l.name, qty: l.qty, unit_price: l.unit_price, line_total: l.line_total }));
    await sb.from("order_items").insert(items);
    $("#orderModal").hidden = true;
    toast(tr("toastSaved"));
    await renderOrders();
  } catch (ex) { alert(ex.message || String(ex)); }
}

async function deleteOrder() {
  if (!editingOrderId) return;
  if (!confirm(tr("confirmDelete"))) return;
  try {
    await sb.from("orders").delete().eq("id", editingOrderId);
    $("#orderModal").hidden = true;
    toast(tr("toastSaved"));
    await renderOrders();
  } catch (ex) { alert(ex.message || String(ex)); }
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
  if (!box || !biz || !biz.commerce_enabled) return;
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
  let orders = [];
  try {
    const { data } = await sb.from("orders").select("*").eq("business_id", biz.id)
      .gte("placed_at", from.toISOString()).lte("placed_at", to.toISOString());
    orders = (data || []).filter((o) => o.status !== "cancelled");
  } catch (e) { results.innerHTML = emptyHTML("📈", tr("repNoData"), tr("repNoDataHint")); return; }
  if (!orders.length) { results.innerHTML = emptyHTML("📈", tr("repNoData"), tr("repNoDataHint")); return; }

  let items = [];
  try { const { data } = await sb.from("order_items").select("*").in("order_id", orders.map((o) => o.id)); items = data || []; } catch (e) {}

  const revenue = orders.reduce((a, o) => a + (Number(o.total) || 0), 0);
  const paid = orders.reduce((a, o) => a + (Number(o.amount_paid) || 0), 0);
  const outstanding = Math.max(0, revenue - paid);
  const units = items.reduce((a, i) => a + (Number(i.qty) || 0), 0);
  const retailRev = orders.filter((o) => o.order_type !== "wholesale").reduce((a, o) => a + (Number(o.total) || 0), 0);
  const wholeRev = Math.max(0, revenue - retailRev);

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
    <div class="bi-cols">
      <div class="bi-box"><h4 class="bi-h">${tr("repTopProducts")}</h4>
        ${topProd.map(([n, d]) => `<div class="bi-bar-row"><span class="bi-bar-lbl">${esc(n)} <small style="color:var(--ink-faint)">×${plainNum(d.qty)}</small></span><span class="bi-bar"><span class="bi-bar-fill" style="width:${Math.round((d.rev / maxRev) * 100)}%"></span></span><span class="bi-bar-num">${money(d.rev)}</span></div>`).join("")}
      </div>
      <div class="bi-box"><h4 class="bi-h">${tr("repTopCustomers")}</h4>
        ${topCust.map(([n, v], i) => `<div class="bi-vip-row"><span class="bi-rank">${i + 1}</span><span class="bi-vip-name">${esc(n)}</span><span class="bi-vip-c">${money(v)}</span></div>`).join("")}
      </div>
    </div>`;
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
  const commerce = !!(biz && biz.commerce_enabled);
  const apptTabs = ["calendar", "appointments", "blocks", "waitlist", "staff", "customers"];
  const commerceTabs = ["catalog", "orders", "reports"];
  document.querySelectorAll(".tabs .tab").forEach((t) => {
    const tab = t.dataset.tab;
    if (apptTabs.includes(tab)) t.hidden = inquiry;
    else if (tab === "leads") t.hidden = !inquiry;
    else if (commerceTabs.includes(tab)) t.hidden = !commerce;
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
  const co = $("#commerceOn"); if (co) co.checked = !!biz.commerce_enabled;
  const cc = $("#bizCurrency"); if (cc) cc.value = biz.currency || "EUR";
  // Toggle-t e fushave të katalogut
  const cfb = $("#catFieldsBlock"); if (cfb) cfb.hidden = !biz.commerce_enabled;
  if ($("#cfgDesc")) $("#cfgDesc").checked = showField("catDesc");
  if ($("#cfgUnit")) $("#cfgUnit").checked = showField("catUnit");
  if ($("#cfgStock")) $("#cfgStock").checked = showField("catStock");
  if ($("#cfgSku")) $("#cfgSku").checked = showField("catSku");
  if ($("#cfgTiers")) $("#cfgTiers").checked = showField("catTiers");
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
  if (!appts.length) { list.innerHTML = emptyHTML("📅", tr("emptyAppt"), tr("emptyApptHint")); return; }
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
  // Tregti: monedha + ndezja
  const scBtn = $("#saveCommerce");
  if (scBtn) scBtn.onclick = async () => {
    try {
      const payload = { commerce_enabled: $("#commerceOn").checked, currency: $("#bizCurrency").value };
      await sb.from("businesses").update(payload).eq("id", biz.id);
      biz.commerce_enabled = payload.commerce_enabled; biz.currency = payload.currency;
      const cfb = $("#catFieldsBlock"); if (cfb) cfb.hidden = !biz.commerce_enabled;
      applyModeUI(); renderCatalog(); if (biz.commerce_enabled) renderOrders(); await renderAll();
      toast(tr("toastSaved"));
    } catch (ex) { alert(ex.message || String(ex)); }
  };
  // Përshtatja: fik/ndiz fushat e katalogut
  if ($("#saveFields")) $("#saveFields").onclick = async () => {
    const cfg = Object.assign({}, biz.config || {});
    cfg.catDesc = $("#cfgDesc").checked; cfg.catUnit = $("#cfgUnit").checked;
    cfg.catStock = $("#cfgStock").checked; cfg.catSku = $("#cfgSku").checked; cfg.catTiers = $("#cfgTiers").checked;
    try {
      await sb.from("businesses").update({ config: cfg }).eq("id", biz.id);
      biz.config = cfg; renderCatalog(); toast(tr("toastSaved"));
    } catch (ex) { alert(ex.message || String(ex)); }
  };
  // Katalogu: editori i artikullit
  if ($("#btnAddItem")) $("#btnAddItem").onclick = () => openItem(null);
  if ($("#addTier")) $("#addTier").onclick = () => addTierRow();
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
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#manModal").hidden) $("#manModal").hidden = true;
    if ($("#itemModal") && !$("#itemModal").hidden) $("#itemModal").hidden = true;
    if ($("#orderModal") && !$("#orderModal").hidden) $("#orderModal").hidden = true;
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
