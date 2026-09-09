import { z } from "zod";

const listType = z.enum(["BLACKLIST", "WHITELIST"], { message: "invalidListType" });

const groupRuleSchema = z.object({
  targetType: z.literal("group"),
  listType,
  foodGroupId: z.string().min(1, { message: "groupRequired" }),
});

// Targets a whole IngredientGroup (e.g. "Chicken" — every USDA chicken cut,
// see HANDOVER D18), optionally narrowed to one named preparation the same
// way an item rule can be — "any chicken, fried" rather than "this one exact
// cut, fried".
const foodRuleSchema = z.object({
  targetType: z.literal("food"),
  listType,
  ingredientGroupId: z.string().min(1, { message: "foodRequired" }),
  preparation: z.string().trim().max(100).optional(),
});

const itemRuleSchema = z.object({
  targetType: z.literal("item"),
  listType,
  kind: z.enum(["ingredient", "product"], { message: "itemRequired" }),
  itemId: z.string().min(1, { message: "itemRequired" }),
  preparation: z.string().trim().max(100).optional(),
});

export const exclusionRuleSchema = z.discriminatedUnion("targetType", [
  groupRuleSchema,
  foodRuleSchema,
  itemRuleSchema,
]);
