import { z } from "zod";
import { MealTypeTag, MealEffortTag } from "@/generated/prisma/enums";

const componentSchema = z.object({
  kind: z.enum(["ingredient", "product"]),
  id: z.string().min(1),
  quantityG: z.number().positive(),
});

export const mealSchema = z.object({
  name: z.string().trim().min(1, { message: "nameRequired" }),
  description: z.string().trim().optional(),
  steps: z.string().trim().optional(),
  safetyNote: z.string().trim().optional(),
  typeTags: z.array(z.enum(Object.values(MealTypeTag) as [string, ...string[]])),
  effortTags: z.array(z.enum(Object.values(MealEffortTag) as [string, ...string[]])),
  components: z.array(componentSchema).min(1, { message: "componentsRequired" }),
});

export type MealInput = z.infer<typeof mealSchema>;
