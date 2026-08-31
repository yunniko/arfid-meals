"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { mealSchema } from "@/lib/meal-validation";
import type { MealEffortTag, MealTypeTag } from "@/generated/prisma/enums";

export type ActionState = { error?: string } | undefined;

function parseMealForm(formData: FormData) {
  const componentsRaw = formData.get("components");
  let components: unknown = [];
  try {
    components = JSON.parse(String(componentsRaw ?? "[]"));
  } catch {
    components = [];
  }
  return mealSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    steps: formData.get("steps") || undefined,
    safetyNote: formData.get("safetyNote") || undefined,
    typeTags: formData.getAll("typeTags"),
    effortTags: formData.getAll("effortTags"),
    components,
  });
}

async function replaceComponents(mealId: string, components: { kind: string; id: string; quantityG: number }[]) {
  await prisma.mealComponent.deleteMany({ where: { mealId } });
  await prisma.mealComponent.createMany({
    data: components.map((c) => ({
      mealId,
      ingredientId: c.kind === "ingredient" ? c.id : null,
      productId: c.kind === "product" ? c.id : null,
      quantityG: c.quantityG,
    })),
  });
}

export async function createMealAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = parseMealForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "unknown" };
  }

  const meal = await prisma.meal.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      steps: parsed.data.steps ?? null,
      safetyNote: parsed.data.safetyNote ?? null,
      typeTags: parsed.data.typeTags as MealTypeTag[],
      effortTags: parsed.data.effortTags as MealEffortTag[],
      createdById: session.user.id,
    },
  });
  await replaceComponents(meal.id, parsed.data.components);

  revalidatePath("/admin/meals");
  revalidatePath("/meals");
  redirect("/admin/meals");
}

export async function updateMealAction(
  mealId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseMealForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "unknown" };
  }

  await prisma.meal.update({
    where: { id: mealId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      steps: parsed.data.steps ?? null,
      safetyNote: parsed.data.safetyNote ?? null,
      typeTags: parsed.data.typeTags as MealTypeTag[],
      effortTags: parsed.data.effortTags as MealEffortTag[],
    },
  });
  await replaceComponents(mealId, parsed.data.components);

  revalidatePath("/admin/meals");
  revalidatePath("/meals");
  redirect("/admin/meals");
}

export async function deleteMealAction(mealId: string) {
  await requireAdmin();
  await prisma.meal.delete({ where: { id: mealId } });
  revalidatePath("/admin/meals");
  revalidatePath("/meals");
}
