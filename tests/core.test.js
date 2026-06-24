// Teste për logjikën bazë (node:test — pa varësi, pa instalim).
// Ekzekuto:  node --test
const test = require("node:test");
const assert = require("node:assert");
const OB = require("../core.js");

test("round2 shmang gabimet e float", () => {
  assert.strictEqual(OB.round2(0.1 + 0.2), 0.3);
  assert.strictEqual(OB.round2(19.999), 20);
  assert.strictEqual(OB.round2(10 / 3), 3.33);
  assert.strictEqual(OB.round2("abc"), 0);
});

test("toMin / toHM (vajtje-ardhje)", () => {
  assert.strictEqual(OB.toMin("09:30"), 570);
  assert.strictEqual(OB.toMin("00:00"), 0);
  assert.strictEqual(OB.toHM(570), "09:30");
  assert.strictEqual(OB.toHM(0), "00:00");
  assert.strictEqual(OB.hm("09:30:00"), "09:30");
});

test("durToMin", () => {
  assert.strictEqual(OB.durToMin(30, "min"), 30);
  assert.strictEqual(OB.durToMin(1, "hour"), 60);
  assert.strictEqual(OB.durToMin(0, "min"), 30); // default
  assert.strictEqual(OB.durToMin(2, "min"), 5);  // minimum 5
  assert.strictEqual(OB.durToMin(1, "day"), 30); // jo-slot → default
});

test("bestUnitPrice — çmimi me shumicë sipas sasisë", () => {
  const tiers = [{ min_qty: 10, unit_price: 8 }, { min_qty: 100, unit_price: 6 }];
  assert.strictEqual(OB.bestUnitPrice(10, tiers, 1), 10);   // bazë
  assert.strictEqual(OB.bestUnitPrice(10, tiers, 10), 8);   // shkalla 1
  assert.strictEqual(OB.bestUnitPrice(10, tiers, 99), 8);
  assert.strictEqual(OB.bestUnitPrice(10, tiers, 100), 6);  // shkalla 2
  assert.strictEqual(OB.bestUnitPrice(10, [], 50), 10);     // pa shkallë
});

test("computeSlots — bazë", () => {
  const s = OB.computeSlots({ openMin: 540, closeMin: 660, durMin: 30, stepMin: 30 }); // 09:00–11:00
  assert.deepStrictEqual(s, ["09:00", "09:30", "10:00", "10:30"]);
});

test("computeSlots — respekton mbivendosjen me takim ekzistues (jo vetëm orën identike)", () => {
  // Takim 10:00 për 60 min → bllokon 10:00 DHE 10:30
  const busy = [[600, 660]];
  const s = OB.computeSlots({ openMin: 540, closeMin: 660, durMin: 30, stepMin: 30, busy });
  assert.deepStrictEqual(s, ["09:00", "09:30"]); // 10:00 dhe 10:30 të zëna
});

test("computeSlots — pushimet (dreka) bllokohen", () => {
  const breaks = [[600, 720]]; // 10:00–12:00 pushim
  const s = OB.computeSlots({ openMin: 540, closeMin: 780, durMin: 30, stepMin: 30, busy: breaks });
  assert.ok(!s.includes("10:00"));
  assert.ok(!s.includes("11:30"));
  assert.ok(s.includes("09:00"));
  assert.ok(s.includes("12:00"));
});

test("computeSlots — fshin oraret e shkuara sot", () => {
  const s = OB.computeSlots({ openMin: 540, closeMin: 660, durMin: 30, stepMin: 30, nowMin: 600 });
  assert.ok(!s.includes("09:00")); // e shkuar
  assert.ok(!s.includes("10:00")); // == now, përjashtohet (<=)
  assert.ok(s.includes("10:30"));
});

test("computeSlots — kohëzgjatje që s'futet para mbylljes përjashtohet", () => {
  const s = OB.computeSlots({ openMin: 540, closeMin: 600, durMin: 45, stepMin: 30 }); // 09:00–10:00, 45min
  assert.deepStrictEqual(s, ["09:00"]); // 09:30+45=10:15 > 10:00
});

test("fieldVisible — override per-artikull mbi default-in global", () => {
  assert.strictEqual(OB.fieldVisible("stock", ["stock", "sku"], true), false); // fshehur per-artikull
  assert.strictEqual(OB.fieldVisible("tiers", ["stock"], true), true);         // jo në listë → dukshëm
  assert.strictEqual(OB.fieldVisible("desc", null, true), true);              // pa override → default global on
  assert.strictEqual(OB.fieldVisible("desc", null, false), false);           // pa override → default global off
  assert.strictEqual(OB.fieldVisible("stock", [], true), true);              // listë bosh → asgjë e fshehur
});

test("overlaps", () => {
  assert.strictEqual(OB.overlaps(600, 30, [[600, 660]]), true);
  assert.strictEqual(OB.overlaps(570, 30, [[600, 660]]), false);
  assert.strictEqual(OB.overlaps(630, 30, [[600, 660]]), true);
});
