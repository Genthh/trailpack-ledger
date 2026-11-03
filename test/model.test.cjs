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
