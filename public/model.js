"use strict";

const Trailpack = (() => {
  const categories = ["Clothing", "Water", "Food", "Equipment", "Essentials"];

  function validItem(item) {
    return (
      item &&
      typeof item.id === "string" &&
      item.id.length > 0 &&
      typeof item.name === "string" &&
      item.name.trim().length > 0 &&
      item.name.length <= 60 &&
      categories.includes(item.category) &&
      Number.isInteger(item.grams) &&
      item.grams >= 1 &&
      item.grams <= 100000 &&
      Number.isInteger(item.qty) &&
      item.qty >= 1 &&
      item.qty <= 99 &&
      typeof item.packed === "boolean"
    );
  }

  function validBudget(value) {
    return Number.isFinite(value) && value >= 0.1 && value <= 100;
  }

  function validPack(data) {
    return (
      data &&
      Array.isArray(data.items) &&
      data.items.every(validItem) &&
      new Set(data.items.map((item) => item.id)).size === data.items.length &&
      validBudget(data.budget)
    );
  }

  function deserialize(raw) {
    try {
      const data = JSON.parse(raw);
      return validPack(data) ? data : null;
    } catch {
      return null;
    }
  }

  function validName(value) {
    return (
      typeof value === "string" && value.trim().length > 0 && value.length <= 60
    );
  }

  function readLibrary(raw) {
    try {
      const data = JSON.parse(raw);
      if (
        data.version !== 2 ||
        !Array.isArray(data.hikes) ||
        !data.hikes.length
      )
        return null;
      if (
        !data.hikes.every(
          (hike) =>
            validPack(hike) && validName(hike.id) && validName(hike.name),
        )
      )
        return null;
      const ids = new Set(data.hikes.map((hike) => hike.id));
      return ids.size === data.hikes.length && ids.has(data.active)
        ? data
        : null;
    } catch {
      return null;
    }
  }

  function newLibrary(legacy) {
    const pack = deserialize(legacy) || initial();
    return {
      version: 2,
      active: "day-hike",
      hikes: [
        {
          id: "day-hike",
          name: "Day hike",
          budget: pack.budget,
          items: pack.items,
        },
      ],
    };
  }

  function createHike(id, name, source) {
    return {
      id,
      name: name.trim(),
      budget: source ? source.budget : 5,
      items: source
        ? source.items.map((item) => ({ ...item, packed: false }))
        : [],
    };
  }

  function categoryWeights(items) {
    return categories
      .map((category) => ({
        category,
        grams: items
          .filter((item) => item.category === category)
          .reduce((sum, item) => sum + item.qty * item.grams, 0),
      }))
      .filter((entry) => entry.grams > 0)
      .sort((a, b) => b.grams - a.grams);
  }

  function initial() {
    return {
      budget: 5,
      items: [
        {
          id: "jacket",
          name: "Rain shell",
          category: "Clothing",
          grams: 275,
          qty: 1,
          packed: false,
        },
        {
          id: "bottle",
          name: "Full water bottle",
          category: "Water",
          grams: 920,
          qty: 1,
          packed: false,
        },
        {
          id: "snacks",
          name: "Trail mix",
          category: "Food",
          grams: 205,
          qty: 1,
          packed: false,
        },
      ],
    };
  }

  function totals(items) {
    return items.reduce(
      (sum, item) => ({
        grams: sum.grams + item.grams * item.qty,
        units: sum.units + item.qty,
        packed: sum.packed + (item.packed ? item.qty : 0),
      }),
      { grams: 0, units: 0, packed: 0 },
    );
  }

  return {
    categories,
    validItem,
    validBudget,
    deserialize,
    initial,
    totals,
    readLibrary,
    newLibrary,
    createHike,
    categoryWeights,
  };
})();

if (typeof module !== "undefined") module.exports = Trailpack;
