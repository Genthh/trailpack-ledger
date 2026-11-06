"use strict";

globalThis.createFieldSheet = function ({
  get,
  weight,
  model,
  getHike,
  getHikes,
}) {
  const select = get("compare-with");
  const comparison = get("compare-hikes");
  const cell = (tag, value) => {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
  };

  function refreshComparison() {
    if (!comparison.open) return;
    const active = getHike();
    const others = getHikes().filter((hike) => hike.id !== active.id);
    const other = others.find((hike) => hike.id === select.value) || others[0];
    select.replaceChildren(
      ...others.map((hike) => new Option(hike.name, hike.id)),
    );
    get("compare-empty").hidden = Boolean(other);
    get("compare-panel").hidden = !other;
    if (!other) return;
    select.value = other.id;
    const { rows, delta } = model.compareLoads(active, other);
    get("compare-summary").textContent =
      delta === 0
        ? active.name + " and " + other.name + " weigh the same."
        : active.name +
          " is " +
          weight(Math.abs(delta)) +
          (delta > 0 ? " heavier than " : " lighter than ") +
          other.name +
          ".";
    get("compare-table")
      .querySelector("tbody")
      .replaceChildren(
        ...rows.map(({ category, activeGrams, otherGrams }) => {
          const tr = document.createElement("tr");
          const title = cell("th", category);
          title.scope = "row";
          tr.append(
            title,
            cell("td", weight(activeGrams)),
            cell("td", weight(otherGrams)),
          );
          return tr;
        }),
      );
    get("compare-table").hidden = !rows.length;
  }

  function refreshPrint() {
    const hike = getHike();
    const totals = model.totals(hike.items);
    get("print-name").textContent = hike.name;
    get("print-stats").textContent =
      weight(totals.grams) +
      " planned · " +
      hike.budget +
      " kg budget · " +
      totals.packed +
      " of " +
      totals.units +
      " packed";
    get("print-gear").replaceChildren(
      ...hike.items.map((item) => {
        const row = document.createElement("tr");
        const check = cell("td", "");
        const mark = cell("span", item.packed ? "✓" : "");
        mark.className = "pack-box";
        mark.setAttribute("aria-hidden", "true");
        const label = cell("span", item.packed ? "Packed" : "To pack");
        label.className = "visually-hidden";
        check.append(mark, label);
        const name = cell("th", item.name);
        name.scope = "row";
        name.append(cell("small", item.category));
        row.append(
          check,
          name,
          cell("td", String(item.qty)),
          cell("td", weight(item.grams * item.qty)),
        );
        return row;
      }),
    );
    get("print-empty").hidden = hike.items.length !== 0;
  }

  comparison.addEventListener("toggle", refreshComparison);
  select.addEventListener("change", refreshComparison);
  window.addEventListener("beforeprint", refreshPrint);
  get("print-pack").addEventListener("click", () => {
    refreshPrint();
    window.print();
  });
  return { refresh: refreshComparison };
};
