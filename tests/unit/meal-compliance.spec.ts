import { describe, expect, it } from "vitest";
import {
  isInGroupOrDescendant,
  componentMatchesRule,
  isMealCompliant,
  type ComplianceComponent,
  type ComplianceRule,
  type ComplianceMeal,
  type FoodGroupNode,
} from "@/lib/meal-compliance";

// Mirrors the real seed-taxonomy.ts tree: meat -> poultry/beef/...
const GROUPS: FoodGroupNode[] = [
  { id: "meat", parentId: null },
  { id: "poultry", parentId: "meat" },
  { id: "beef", parentId: "meat" },
  { id: "vegetables", parentId: null },
];

function component(overrides: Partial<ComplianceComponent> = {}): ComplianceComponent {
  return { ingredientId: null, productId: null, ingredientFoodGroupId: null, ...overrides };
}

function rule(overrides: Partial<ComplianceRule> = {}): ComplianceRule {
  return {
    listType: "BLACKLIST",
    foodGroupId: null,
    ingredientId: null,
    productId: null,
    preparation: null,
    ...overrides,
  };
}

describe("isInGroupOrDescendant", () => {
  it("matches the group itself", () => {
    expect(isInGroupOrDescendant("poultry", "poultry", GROUPS)).toBe(true);
  });

  it("matches a child group against its parent", () => {
    expect(isInGroupOrDescendant("poultry", "meat", GROUPS)).toBe(true);
  });

  it("does not match unrelated groups", () => {
    expect(isInGroupOrDescendant("poultry", "vegetables", GROUPS)).toBe(false);
  });

  it("does not match a parent against its own child (one-directional)", () => {
    expect(isInGroupOrDescendant("meat", "poultry", GROUPS)).toBe(false);
  });
});

describe("componentMatchesRule", () => {
  it("matches a group rule via the component's leaf group", () => {
    const chicken = component({ ingredientId: "chicken", ingredientFoodGroupId: "poultry" });
    expect(componentMatchesRule(chicken, rule({ foodGroupId: "meat" }), "", GROUPS)).toBe(true);
  });

  it("does not crash or match a group rule against a product (no food group)", () => {
    const productComponent = component({ productId: "some-product" });
    expect(componentMatchesRule(productComponent, rule({ foodGroupId: "meat" }), "", GROUPS)).toBe(
      false,
    );
  });

  it("matches an item rule with no preparation regardless of meal text", () => {
    const chicken = component({ ingredientId: "chicken" });
    const r = rule({ ingredientId: "chicken" });
    expect(componentMatchesRule(chicken, r, "grilled chicken salad", GROUPS)).toBe(true);
    expect(componentMatchesRule(chicken, r, "", GROUPS)).toBe(true);
  });

  it("only matches a preparation-qualified item rule when the meal text names it", () => {
    const chicken = component({ ingredientId: "chicken" });
    const r = rule({ ingredientId: "chicken", preparation: "fried" });
    expect(componentMatchesRule(chicken, r, "fried chicken and rice", GROUPS)).toBe(true);
    expect(componentMatchesRule(chicken, r, "grilled chicken and rice", GROUPS)).toBe(false);
  });

  it("matches product-based item rules the same way as ingredients", () => {
    const yogurt = component({ productId: "yogurt-1" });
    expect(componentMatchesRule(yogurt, rule({ productId: "yogurt-1" }), "", GROUPS)).toBe(true);
    expect(componentMatchesRule(yogurt, rule({ productId: "yogurt-2" }), "", GROUPS)).toBe(false);
  });
});

describe("isMealCompliant", () => {
  it("is compliant with no rules at all", () => {
    const meal: ComplianceMeal = { mealText: "", components: [component()] };
    expect(isMealCompliant(meal, [], GROUPS)).toBe(true);
  });

  it("excludes a meal containing a blacklisted whole group", () => {
    const meal: ComplianceMeal = {
      mealText: "chicken and rice",
      components: [component({ ingredientId: "chicken", ingredientFoodGroupId: "poultry" })],
    };
    expect(isMealCompliant(meal, [rule({ foodGroupId: "meat" })], GROUPS)).toBe(false);
  });

  it("allows a meal whose group is unrelated to the blacklist", () => {
    const meal: ComplianceMeal = {
      mealText: "rice and beans",
      components: [component({ ingredientId: "rice", ingredientFoodGroupId: "vegetables" })],
    };
    expect(isMealCompliant(meal, [rule({ foodGroupId: "meat" })], GROUPS)).toBe(true);
  });

  it("excludes a meal only when the blacklisted preparation is actually named", () => {
    const rules = [rule({ ingredientId: "chicken", preparation: "fried" })];
    const friedMeal: ComplianceMeal = {
      mealText: "fried chicken",
      components: [component({ ingredientId: "chicken" })],
    };
    const grilledMeal: ComplianceMeal = {
      mealText: "grilled chicken",
      components: [component({ ingredientId: "chicken" })],
    };
    expect(isMealCompliant(friedMeal, rules, GROUPS)).toBe(false);
    expect(isMealCompliant(grilledMeal, rules, GROUPS)).toBe(true);
  });

  it("whitelist-only: requires every component to be covered", () => {
    const rules: ComplianceRule[] = [
      rule({ listType: "WHITELIST", ingredientId: "rice" }),
      rule({ listType: "WHITELIST", ingredientId: "chicken" }),
    ];
    const fullyCovered: ComplianceMeal = {
      mealText: "",
      components: [component({ ingredientId: "rice" }), component({ ingredientId: "chicken" })],
    };
    const partiallyCovered: ComplianceMeal = {
      mealText: "",
      components: [component({ ingredientId: "rice" }), component({ ingredientId: "broccoli" })],
    };
    expect(isMealCompliant(fullyCovered, rules, GROUPS)).toBe(true);
    expect(isMealCompliant(partiallyCovered, rules, GROUPS)).toBe(false);
  });

  it("applies blacklist and whitelist together", () => {
    const rules: ComplianceRule[] = [
      rule({ listType: "WHITELIST", foodGroupId: "meat" }),
      rule({ listType: "BLACKLIST", ingredientId: "beef-1" }),
    ];
    // Whitelisted group (meat) but this specific item is separately blacklisted.
    const meal: ComplianceMeal = {
      mealText: "",
      components: [
        component({ ingredientId: "beef-1", ingredientFoodGroupId: "beef" }),
      ],
    };
    expect(isMealCompliant(meal, rules, GROUPS)).toBe(false);
  });
});
