import { z } from "zod";

const listType = z.enum(["BLACKLIST", "WHITELIST"], { message: "invalidListType" });

const groupRuleSchema = z.object({
  targetType: z.literal("group"),
  listType,
  foodGroupId: z.string().min(1, { message: "groupRequired" }),
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
  itemRuleSchema,
]);
