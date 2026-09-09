import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getProfileWithRules, listFoodGroups } from "@/lib/profile-queries";
import { listIngredientGroups } from "@/lib/nutrition-queries";
import { removeExclusionRuleAction } from "@/lib/exclusion-actions";
import { GroupRuleForm } from "@/components/profile/group-rule-form";
import { FoodRuleForm } from "@/components/profile/food-rule-form";
import { ItemRuleForm } from "@/components/profile/item-rule-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [t, profile, groups, ingredientGroups] = await Promise.all([
    getTranslations("Profile"),
    getProfileWithRules(session.user.id),
    listFoodGroups(),
    listIngredientGroups(),
  ]);
  const rules = profile?.exclusionRules ?? [];

  function ruleLabel(rule: (typeof rules)[number]): string {
    const list = t(rule.listType === "BLACKLIST" ? "blacklist" : "whitelist");
    if (rule.foodGroup) return t("ruleGroup", { list, name: rule.foodGroup.name });
    const name = rule.ingredientGroup?.name ?? rule.ingredient?.name ?? rule.product?.name ?? "";
    if (rule.preparation) return t("ruleItemPrepared", { list, name, preparation: rule.preparation });
    return t("ruleItemAny", { list, name });
  }

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{t("heading")}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{session.user.email}</p>

        <h2 className="mt-8 text-lg font-semibold">{t("rulesHeading")}</h2>
        {rules.length === 0 ? (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">{t("noRules")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-black/10 dark:divide-white/10">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm">{ruleLabel(rule)}</span>
                <form action={removeExclusionRuleAction.bind(null, rule.id)}>
                  <button type="submit" className="text-xs text-red-700 underline dark:text-red-400">
                    {t("removeButton")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-8 text-lg font-semibold">{t("addGroupHeading")}</h2>
        <div className="mt-2">
          <GroupRuleForm groups={groups} />
        </div>

        <h2 className="mt-8 text-lg font-semibold">{t("addFoodHeading")}</h2>
        <div className="mt-2">
          <FoodRuleForm
            groups={ingredientGroups.map((g) => ({
              id: g.id,
              name: g.name,
              variantCount: g._count.ingredients,
            }))}
          />
        </div>

        <h2 className="mt-8 text-lg font-semibold">{t("addItemHeading")}</h2>
        <div className="mt-2">
          <ItemRuleForm />
        </div>
      </div>
    </main>
  );
}
