"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addExclusionRuleAction, type ActionState } from "@/lib/exclusion-actions";
import { SearchCombobox, type SearchResult } from "@/components/search-combobox";

type Kind = "ingredient" | "product";
type Selected = { kind: Kind; id: string; name: string };

export function ItemRuleForm() {
  const t = useTranslations("Profile");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addExclusionRuleAction,
    {},
  );
  const [selected, setSelected] = useState<Selected | null>(null);

  function pick(kind: Kind, result: SearchResult) {
    setSelected({ kind, id: result.id, name: result.name });
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="targetType" value="item" />
      {selected && <input type="hidden" name="kind" value={selected.kind} />}
      {selected && <input type="hidden" name="itemId" value={selected.id} />}

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

      <div>
        <span className="text-sm font-medium">{t("itemLabel")}</span>
        {selected ? (
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span>{selected.name}</span>
            <button type="button" onClick={() => setSelected(null)} className="underline">
              {t("changeButton")}
            </button>
          </div>
        ) : (
          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SearchCombobox
              kind="ingredient"
              placeholder={t("itemSearchPlaceholder")}
              onSelect={(r) => pick("ingredient", r)}
            />
            <SearchCombobox
              kind="product"
              placeholder={t("itemSearchPlaceholder")}
              onSelect={(r) => pick("product", r)}
            />
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {t("preparationLabel")}
        <input
          type="text"
          name="preparation"
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        />
      </label>

      <button
        type="submit"
        disabled={pending || !selected}
        className="self-start rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {t("submit")}
      </button>
    </form>
  );
}
