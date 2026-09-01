"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addExclusionRuleAction, type ActionState } from "@/lib/exclusion-actions";

export function GroupRuleForm({
  groups,
}: {
  groups: { id: string; name: string; parentId: string | null }[];
}) {
  const t = useTranslations("Profile");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addExclusionRuleAction,
    {},
  );

  // Parents first, each followed by its own children, indented — mirrors
  // the meat -> beef/poultry/pork/lamb-veal-game tree from seed-taxonomy.ts.
  const topLevel = groups.filter((g) => !g.parentId);
  const ordered = topLevel.flatMap((parent) => [
    parent,
    ...groups.filter((g) => g.parentId === parent.id),
  ]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="targetType" value="group" />

      {state?.error && (
        <p role="alert" className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {t("listTypeLabel")}
        <select
          name="listType"
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        >
          <option value="BLACKLIST">{t("blacklist")}</option>
          <option value="WHITELIST">{t("whitelist")}</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t("groupLabel")}
        <select
          name="foodGroupId"
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        >
          {ordered.map((g) => (
            <option key={g.id} value={g.id}>
              {g.parentId ? `— ${g.name}` : g.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {t("submit")}
      </button>
    </form>
  );
}
