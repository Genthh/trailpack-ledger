"use strict";

const get = (id) => document.getElementById(id);
const key = "trailpack-ledger-v1";
let state = Trailpack.initial();
try {
  state = Trailpack.deserialize(localStorage.getItem(key)) || state;
} catch {
  get("save-note").textContent =
    "Browser storage is unavailable. This list lasts for this visit.";
}
const weight = (grams) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(
    grams / 1000,
  ) + " kg";

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    get("save-note").textContent =
      "Could not save this list. Changes last for this visit.";
  }
}

function summary() {
  const { grams, units, packed } = Trailpack.totals(state.items);
  get("mass-total").textContent = weight(grams);
  get("load-meter").max = state.budget;
  get("load-meter").value = Math.min(grams / 1000, state.budget);
  const remaining = Math.round(state.budget * 1000) - grams;
  get("margin").textContent =
    remaining === 0
      ? "Right on budget."
      : weight(Math.abs(remaining)) +
        (remaining > 0 ? " left in your budget" : " over budget");
  get("pack-progress").textContent = packed + " of " + units + " packed";
  get("empty").hidden = state.items.length !== 0;
}

function row(item) {
  const li = document.createElement("li");
  li.className = "gear";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.id = "packed-" + item.id;
  box.checked = item.packed;
  const content = document.createElement("div");
  const label = document.createElement("label");
  label.htmlFor = box.id;
  label.textContent = item.name;
  const meta = document.createElement("p");
  meta.className = "item-meta";
  meta.textContent =
    item.category + " · " + item.qty + " × " + item.grams + " g";
  content.append(label, meta);
  box.addEventListener("change", () => {
    item.packed = box.checked;
    summary();
    save();
    get("status").textContent = get("pack-progress").textContent;
  });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", "Remove " + item.name);
  remove.addEventListener("click", () => {
    const next = li.nextElementSibling || li.previousElementSibling;
    state.items = state.items.filter((current) => current.id !== item.id);
    li.remove();
    summary();
    save();
    (next?.querySelector("button") || get("item-name")).focus();
    get("status").textContent = item.name + " removed.";
  });
  li.append(box, content, remove);
  return li;
}

for (const category of Trailpack.categories)
  get("item-category").add(new Option(category, category));
get("budget").value = state.budget;
get("budget").addEventListener("change", () => {
  const input = get("budget");
  if (!input.reportValidity() || !Trailpack.validBudget(input.valueAsNumber)) {
    input.value = state.budget;
    return;
  }
  state.budget = input.valueAsNumber;
  summary();
  save();
  get("status").textContent = get("margin").textContent;
});
get("entry").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = get("item-name");
  if (!name.value.trim()) {
    name.setCustomValidity("Enter an item name.");
    name.reportValidity();
    return;
  }
  const item = {
    id: crypto.randomUUID(),
    name: name.value.trim(),
    category: get("item-category").value,
    grams: get("item-weight").valueAsNumber,
    qty: get("item-qty").valueAsNumber,
    packed: false,
  };
  if (!Trailpack.validItem(item)) return;
  state.items.push(item);
  get("gear-list").append(row(item));
  get("entry").reset();
  summary();
  save();
  get("status").textContent = item.name + " added.";
  name.focus();
});
get("item-name").addEventListener("input", () =>
  get("item-name").setCustomValidity(""),
);
get("gear-list").append(...state.items.map(row));
summary();
