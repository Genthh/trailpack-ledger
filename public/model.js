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

  function deserialize(raw) {
    try {
      const data = JSON.parse(raw);
      if (
        Array.isArray(data.items) &&
        data.items.every(validItem) &&
        new Set(data.items.map((item) => item.id)).size === data.items.length &&
        validBudget(data.budget)
      ) {
        return data;
      }
    } catch {
      return null;
    }
    return null;
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

  return { categories, validItem, validBudget, deserialize, initial, totals };
})();

if (typeof module !== "undefined") module.exports = Trailpack;
