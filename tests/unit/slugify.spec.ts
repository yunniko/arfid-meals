import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Milk")).toBe("milk");
    expect(slugify("Lamb, veal, and game")).toBe("lamb-veal-and-game");
  });

  it("strips accents", () => {
    expect(slugify("Crème fraîche")).toBe("creme-fraiche");
  });

  it("collapses non-alphanumeric runs and trims leading/trailing hyphens", () => {
    expect(slugify("HORMEL Canadian Style Bacon")).toBe("hormel-canadian-style-bacon");
    expect(slugify("100% Juice")).toBe("100-juice");
  });
});
