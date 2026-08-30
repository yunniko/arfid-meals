import { describe, expect, it } from "vitest";
import {
  inferAllergenSlugsFromName,
  inferContainsGluten,
  inferContainsLactose,
} from "@/lib/food-heuristics";

describe("inferContainsGluten", () => {
  it("flags wheat-derived foods", () => {
    expect(inferContainsGluten("Wheat flour, white, all-purpose, enriched, bleached")).toBe(true);
    expect(inferContainsGluten("Barley, pearled, raw")).toBe(true);
    expect(inferContainsGluten("Rye grain")).toBe(true);
  });

  it("does not flag unrelated raw foods, including oats", () => {
    expect(inferContainsGluten("Chicken, broilers or fryers, breast, meat only, raw")).toBe(
      false,
    );
    expect(inferContainsGluten("Apples, raw, with skin")).toBe(false);
    // Oats are naturally gluten-free (cross-contamination is a separate,
    // real risk — the app's safety disclaimer covers that, this heuristic
    // only reflects the ingredient's own composition).
    expect(inferContainsGluten("Oats")).toBe(false);
  });
});

describe("inferContainsLactose", () => {
  it("flags dairy foods", () => {
    expect(inferContainsLactose("Milk, whole, 3.25% milkfat, with added vitamin D")).toBe(true);
    expect(inferContainsLactose("Cheese, cheddar")).toBe(true);
    expect(inferContainsLactose("Yogurt, plain, whole milk")).toBe(true);
  });

  it("does not flag eggs as lactose-containing", () => {
    expect(inferContainsLactose("Egg, whole, raw, fresh")).toBe(false);
  });

  it("does not flag unrelated raw foods", () => {
    expect(inferContainsLactose("Beef, ground, 85% lean meat / 15% fat, raw")).toBe(false);
  });
});

describe("inferAllergenSlugsFromName", () => {
  it("distinguishes crustaceans, molluscs, and fish", () => {
    expect(inferAllergenSlugsFromName("Crustaceans, shrimp, raw")).toEqual(["crustaceans"]);
    expect(inferAllergenSlugsFromName("Mollusks, clam, raw")).toEqual(["molluscs"]);
    expect(inferAllergenSlugsFromName("Fish, salmon, Atlantic, wild, raw")).toEqual(["fish"]);
  });

  it("distinguishes peanuts from tree nuts", () => {
    expect(inferAllergenSlugsFromName("Peanuts, raw")).toContain("peanuts");
    expect(inferAllergenSlugsFromName("Peanuts, raw")).not.toContain("nuts");
    expect(inferAllergenSlugsFromName("Nuts, almonds")).toContain("nuts");
    expect(inferAllergenSlugsFromName("Nuts, almonds")).not.toContain("peanuts");
  });

  it("can match multiple allergens in one description", () => {
    const slugs = inferAllergenSlugsFromName("Cheese, cottage, low fat, sesame seasoned");
    expect(slugs).toContain("milk");
    expect(slugs).toContain("sesame-seeds");
  });

  it("returns an empty list for a food with no detectable allergens", () => {
    expect(inferAllergenSlugsFromName("Carrots, raw")).toEqual([]);
  });
});
