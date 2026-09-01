"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { exclusionRuleSchema } from "@/lib/exclusion-validation";

export type ActionState = { error?: string } | undefined;

async function requireProfileId(): Promise<string> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Backfills a profile for any account created before this field existed
  // (or if the nested create in registerAction ever failed silently) —
  // every signed-in user should be able to reach this page.
  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });
  return profile.id;
}

export async function addExclusionRuleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profileId = await requireProfileId();
  const targetType = formData.get("targetType");

  const raw =
    targetType === "group"
      ? {
          targetType: "group" as const,
          listType: formData.get("listType"),
          foodGroupId: formData.get("foodGroupId"),
        }
      : {
          targetType: "item" as const,
          listType: formData.get("listType"),
          kind: formData.get("kind"),
          itemId: formData.get("itemId"),
          preparation: formData.get("preparation") || undefined,
        };

  const parsed = exclusionRuleSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "unknown" };
  }

  if (parsed.data.targetType === "group") {
    await prisma.exclusionRule.create({
      data: {
        profileId,
        listType: parsed.data.listType,
        foodGroupId: parsed.data.foodGroupId,
      },
    });
  } else {
    await prisma.exclusionRule.create({
      data: {
        profileId,
        listType: parsed.data.listType,
        ingredientId: parsed.data.kind === "ingredient" ? parsed.data.itemId : null,
        productId: parsed.data.kind === "product" ? parsed.data.itemId : null,
        preparation: parsed.data.preparation || null,
      },
    });
  }

  revalidatePath("/profile");
}

export async function removeExclusionRuleAction(ruleId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Scoped to the caller's own profile — deleteMany silently matches zero
  // rows if the id belongs to someone else's rule, rather than needing a
  // separate ownership lookup that could race.
  await prisma.exclusionRule.deleteMany({
    where: { id: ruleId, profile: { userId: session.user.id } },
  });
  revalidatePath("/profile");
}
