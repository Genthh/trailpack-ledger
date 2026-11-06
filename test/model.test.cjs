const test = require("node:test");
const assert = require("node:assert/strict");
const pack = require("../public/model.js");

test("starter kit is 1400 grams and packing never removes weight", () => {
  const state = pack.initial();
  assert.equal(pack.totals(state.items).grams, 1400);
  state.items[0].qty = 3;
  state.items[0].packed = true;
  assert.deepEqual(pack.totals(state.items), {
    grams: 1950,
    units: 5,
    packed: 3,
  });
  assert.deepEqual(pack.totals([]), { grams: 0, units: 0, packed: 0 });
});

test("storage rejects incomplete, duplicate and invalid items", () => {
  const state = pack.initial();
  assert.deepEqual(pack.deserialize(JSON.stringify(state)), state);
  for (const raw of [
    "null",
    "{}",
    "{",
    JSON.stringify({ ...state, items: [state.items[0], state.items[0]] }),
  ]) {
    assert.equal(pack.deserialize(raw), null);
  }
  assert.equal(pack.validItem({ ...state.items[0], qty: 0 }), false);
  assert.equal(pack.validItem({ ...state.items[0], grams: 1.5 }), false);
  assert.equal(pack.validBudget(-1), false);
  assert.equal(pack.validBudget(0.1), true);
});

test("legacy pack is available as the first hike and its budget and checks survive", () => {
  const legacy = pack.initial();
  legacy.items[0].packed = true;
  legacy.budget = 8;
  const book = pack.newLibrary(JSON.stringify(legacy));
  assert.deepEqual(book.hikes[0].items, legacy.items);
  assert.equal(book.hikes[0].budget, 8);
  assert.deepEqual(pack.readLibrary(JSON.stringify(book)), book);
  assert.equal(
    pack.readLibrary(JSON.stringify({ ...book, active: "missing" })),
    null,
  );
  assert.equal(
    pack.readLibrary(
      JSON.stringify({ ...book, hikes: [book.hikes[0], book.hikes[0]] }),
    ),
    null,
  );
});

test("a duplicate has an independent list and clear packing state", () => {
  const original = pack.initial();
  original.items[0].packed = true;
  const copy = pack.createHike("trip", "  Ridgeline  ", original);
  assert.equal(copy.name, "Ridgeline");
  assert.equal(copy.budget, original.budget);
  assert.equal(copy.items[0].packed, false);
  copy.items[0].qty++;
  assert.equal(original.items[0].qty, 1);
  assert.deepEqual(pack.createHike("empty", "Empty").items, []);
});

test("category load sums quantities and lists the heaviest categories first", () => {
  const item = pack.initial().items[0];
  assert.deepEqual(
    pack.categoryWeights([
      { ...item, qty: 2 },
      { ...item, grams: 50 },
      { ...item, category: "Food", grams: 800 },
    ]),
    [
      { category: "Food", grams: 800 },
      { category: "Clothing", grams: 600 },
    ],
  );
});

test("compare loads sums quantities, includes one-sided categories and ranks the largest differences first", () => {
  const hike = pack.initial();
  const other = {
    items: [
      { ...hike.items[0], grams: 450, qty: 2, packed: true },
      { ...hike.items[0], category: "Essentials", grams: 40 },
    ],
  };
  const result = pack.compareLoads(hike, other);
  assert.equal(result.delta, 460);
  assert.deepEqual(
    result.rows.map((row) => [row.category, row.delta]),
    [
      ["Water", 920],
      ["Clothing", -625],
      ["Food", 205],
      ["Essentials", -40],
    ],
  );
  assert.deepEqual(pack.compareLoads({ items: [] }, { items: [] }), {
    rows: [],
    delta: 0,
  });
  assert.equal(pack.compareLoads(hike, hike).delta, 0);
});
