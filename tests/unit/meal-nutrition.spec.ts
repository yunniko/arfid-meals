import { describe, expect, it } from "vitest";
import { computeMealTotals } from "@/lib/meal-nutrition";

const chickenBreast = {
  quantityG: 150,
  kcal: 120,
  proteinG: 22.5,
  fatG: 2.62,
  carbsG: 0,
  sugarG: 0,
  fiberG: 0,
  sodiumMg: 45,
};

const rice = {
  quantityG: 100,
  kcal: 130,
  proteinG: 2.7,
  fatG: 0.3,
  carbsG: 28,
  sugarG: 0.1,
  fiberG: 0.4,
  sodiumMg: 1,
};

describe("computeMealTotals", () => {
  it("returns all zeros for an empty component list", () => {
    const totals = computeMealTotals([]);
    expect(totals.kcal).toBe(0);
    expect(totals.incompleteFields).toEqual([]);
  });

  it("scales a single component by quantity/100", () => {
    const totals = computeMealTotals([chickenBreast]);
    expect(totals.kcal).toBeCloseTo(180); // 120 * 1.5
    expect(totals.proteinG).toBeCloseTo(33.75); // 22.5 * 1.5
    expect(totals.incompleteFields).toEqual([]);
  });

  it("sums multiple components", () => {
    const totals = computeMealTotals([chickenBreast, rice]);
    expect(totals.kcal).toBeCloseTo(180 + 130); // rice at 100g = 1x
    expect(totals.carbsG).toBeCloseTo(28);
    expect(totals.proteinG).toBeCloseTo(33.75 + 2.7);
  });

  it("flags fields with missing data instead of silently treating them as zero", () => {
    const totals = computeMealTotals([
      { ...chickenBreast, sodiumMg: null },
      { ...rice, sodiumMg: null },
    ]);
    expect(totals.incompleteFields).toEqual(["sodiumMg"]);
    expect(totals.sodiumMg).toBe(0);
  });

  it("still sums the fields that ARE present when one component has partial data", () => {
    const totals = computeMealTotals([chickenBreast, { ...rice, kcal: null }]);
    expect(totals.incompleteFields).toEqual(["kcal"]);
    // Only chicken's kcal contributes; rice's unknown kcal is excluded, not zeroed silently into the total's meaning
    expect(totals.kcal).toBeCloseTo(180);
    // Other fields (both present) are unaffected
    expect(totals.carbsG).toBeCloseTo(28);
  });
});
