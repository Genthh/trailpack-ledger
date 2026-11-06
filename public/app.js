"use strict";

const get = (id) => document.getElementById(id);
const key = "trailpack-ledger-v2";
let library;
try {
  library =
    Trailpack.readLibrary(localStorage.getItem(key)) ||
    Trailpack.newLibrary(localStorage.getItem("trailpack-ledger-v1"));
} catch {
  library = Trailpack.newLibrary(null);
  get("save-note").textContent =
    "Browser storage is unavailable. Plans last for this visit.";
}
let state = library.hikes.find((hike) => hike.id === library.active);
const weight = (grams) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(
    grams / 1000,
  ) + " kg";

const fieldSheet = globalThis.createFieldSheet({
  get,
  weight,
  model: Trailpack,
  getHike: () => state,
  getHikes: () => library.hikes,
});

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(library));
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
  get("category-load").replaceChildren(
    ...Trailpack.categoryWeights(state.items).map(
      ({ category, grams: total }) => {
        const line = document.createElement("li");
        const label = document.createElement("span");
        const value = document.createElement("strong");
        label.textContent = category;
        value.textContent = weight(total);
        const bar = document.createElement("span");
        bar.className = "weight-bar";
        bar.style.setProperty("--share", (total / grams) * 100 + "%");
        bar.setAttribute("aria-hidden", "true");
        line.append(label, value, bar);
        return line;
      },
    ),
  );
  get("load-breakdown").hidden = state.items.length === 0;
  fieldSheet.refresh();
}

let editingId = null;

function finishEditing() {
  editingId = null;
  get("entry").reset();
  get("entry-title").textContent = "Add gear";
  get("item-name").setCustomValidity("");
  get("entry-label").textContent = "Add to pack";
  get("entry-symbol").textContent = "+";
  get("cancel-edit").hidden = true;
}

function editItem(item) {
  editingId = item.id;
  get("entry-title").textContent = "Edit gear";
  get("entry-label").textContent = "Save changes";
  get("entry-symbol").textContent = "";
  get("cancel-edit").hidden = false;
  get("item-name").setCustomValidity("");
  get("item-name").value = item.name;
  get("item-weight").value = item.grams;
  get("item-category").value = item.category;
  get("item-qty").value = item.qty;
  get("item-name").focus();
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
  const actions = document.createElement("div");
  actions.className = "gear-actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "remove";
  edit.textContent = "Edit";
  edit.setAttribute("aria-label", "Edit " + item.name);
  edit.addEventListener("click", () => editItem(item));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", "Remove " + item.name);
  remove.addEventListener("click", () => {
    const next = li.nextElementSibling || li.previousElementSibling;
    state.items = state.items.filter((current) => current.id !== item.id);
    if (editingId === item.id) finishEditing();
    li.remove();
    summary();
    save();
    (next?.querySelector("button") || get("item-name")).focus();
    get("status").textContent = item.name + " removed.";
  });
  actions.append(edit, remove);
  li.append(box, content, actions);
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
  const current = state.items.find((item) => item.id === editingId);
  const item = {
    id: current?.id ?? crypto.randomUUID(),
    name: name.value.trim(),
    category: get("item-category").value,
    grams: get("item-weight").valueAsNumber,
    qty: get("item-qty").valueAsNumber,
    packed: current?.packed ?? false,
  };
  if (!Trailpack.validItem(item)) return;
  if (current) {
    state.items[state.items.indexOf(current)] = item;
    get("gear-list").replaceChildren(...state.items.map(row));
  } else {
    state.items.push(item);
    get("gear-list").append(row(item));
  }
  finishEditing();
  summary();
  save();
  get("status").textContent = item.name + (current ? " updated." : " added.");
  name.focus();
});
get("item-name").addEventListener("input", () =>
  get("item-name").setCustomValidity(""),
);
get("cancel-edit").addEventListener("click", () => {
  const previous = document
    .getElementById("packed-" + editingId)
    ?.closest("li")
    ?.querySelector("button");
  finishEditing();
  (previous || get("item-name")).focus();
});
let action;

function dismiss() {
  action = "";
  get("hike-form").hidden = true;
  get("delete-form").hidden = true;
  get("hike-name").setCustomValidity("");
}

function showHike() {
  dismiss();
  state = library.hikes.find((hike) => hike.id === library.active);
  get("hike-picker").replaceChildren(
    ...library.hikes.map((hike) => new Option(hike.name, hike.id)),
  );
  get("hike-picker").value = state.id;
  get("hike-delete").disabled = library.hikes.length === 1;
  finishEditing();
  get("budget").value = state.budget;
  get("gear-list").replaceChildren(...state.items.map(row));
  summary();
}

get("hike-picker").addEventListener("change", (event) => {
  library.active = event.target.value;
  showHike();
  save();
});

const actions = {
  new: "Create hike",
  copy: "Duplicate hike",
  rename: "Rename hike",
};
for (const [mode, label] of Object.entries(actions)) {
  get("hike-" + mode).addEventListener("click", () => {
    dismiss();
    action = mode;
    get("hike-form").hidden = false;
    const name = get("hike-name");
    name.value =
      mode === "copy"
        ? state.name.slice(0, 53) + " (copy)"
        : mode === "rename"
          ? state.name
          : "";
    get("hike-submit").textContent = label;
    name.focus();
    name.select();
  });
}
get("hike-name").addEventListener("input", () =>
  get("hike-name").setCustomValidity(""),
);
get("hike-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = get("hike-name");
  const trimmed = name.value.trim();
  const duplicate = library.hikes.some(
    (hike) =>
      (action !== "rename" || hike.id !== state.id) &&
      hike.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (!trimmed || duplicate) {
    name.setCustomValidity(
      trimmed ? "Choose a different hike name." : "Enter a hike name.",
    );
    name.reportValidity();
    return;
  }
  if (action === "rename") state.name = trimmed;
  else {
    const hike = Trailpack.createHike(
      crypto.randomUUID(),
      trimmed,
      action === "copy" ? state : null,
    );
    library.hikes.push(hike);
    library.active = hike.id;
  }
  showHike();
  save();
  get("hike-picker").focus();
  get("status").textContent = state.name + " selected.";
});
get("hike-delete").addEventListener("click", () => {
  dismiss();
  get("delete-form").hidden = false;
  get("delete-message").textContent =
    "Delete “" + state.name + "” and its gear list?";
  get("delete-cancel").focus();
});
get("hike-confirm-delete").addEventListener("click", () => {
  if (library.hikes.length === 1) return;
  library.hikes = library.hikes.filter((hike) => hike.id !== state.id);
  library.active = library.hikes[0].id;
  showHike();
  save();
  get("hike-picker").focus();
  get("status").textContent = "Hike deleted. " + state.name + " selected.";
});
for (const id of ["hike-cancel", "delete-cancel"])
  get(id).addEventListener("click", () => {
    dismiss();
    get("hike-picker").focus();
  });
window.addEventListener("storage", (event) => {
  if (event.key !== key) return;
  const saved = Trailpack.readLibrary(event.newValue);
  if (saved) {
    library = saved;
    showHike();
  }
});
showHike();
