import { describe, expect, it } from "vitest";
import { deriveIngredientGroupName, computeIngredientGroups } from "@/lib/ingredient-grouping";

describe("deriveIngredientGroupName", () => {
  it("takes the first comma segment", () => {
    expect(deriveIngredientGroupName("Milk, dry, nonfat, instant")).toBe("Milk");
    expect(deriveIngredientGroupName("Chicken, broilers or fryers, breast, raw")).toBe("Chicken");
  });

  it("returns the whole name when there is no comma", () => {
    expect(deriveIngredientGroupName("Eggnog")).toBe("Eggnog");
  });
});

describe("computeIngredientGroups", () => {
  it("groups ingredients that share a first comma segment", () => {
    const groups = computeIngredientGroups([
      { id: "1", name: "Milk, whole, 3.25% milkfat" },
      { id: "2", name: "Milk, dry, nonfat" },
      { id: "3", name: "Eggnog" },
    ]);
    expect(groups).toEqual([{ name: "Milk", memberIds: ["1", "2"] }]);
  });

  it("does not group a name that only appears once", () => {
    const groups = computeIngredientGroups([
      { id: "1", name: "Eggplant, raw" },
      { id: "2", name: "Egg, whole, raw, fresh" },
    ]);
    expect(groups).toEqual([]);
  });

  it("does not conflate substrings of a group name (egg vs eggplant vs eggnog)", () => {
    const groups = computeIngredientGroups([
      { id: "1", name: "Egg, whole, raw, fresh" },
      { id: "2", name: "Egg, white, raw, fresh" },
      { id: "3", name: "Eggplant, raw" },
      { id: "4", name: "Eggnog" },
    ]);
    expect(groups).toEqual([{ name: "Egg", memberIds: ["1", "2"] }]);
  });
});
