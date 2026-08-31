"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { MealTypeTag, MealEffortTag } from "@/generated/prisma/enums";
import { ComponentPicker } from "@/components/admin/component-picker";
import type { ActionState } from "@/lib/meal-actions";

type InitialComponent = { kind: "ingredient" | "product"; id: string; name: string; quantityG: number };

export function MealForm({
  action,
  initial,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: {
    name: string;
    description: string;
    steps: string;
    safetyNote: string;
    typeTags: string[];
    effortTags: string[];
    components: InitialComponent[];
  };
}) {
  const t = useTranslations("Admin.meals.form");
  const tType = useTranslations("MealTypeTag");
  const tEffort = useTranslations("MealEffortTag");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p role="alert" className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        {t("name")}
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("description")}
        <textarea
          name="description"
          defaultValue={initial?.description}
          rows={2}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("steps")}
        <textarea
          name="steps"
          defaultValue={initial?.steps}
          rows={4}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("safetyNote")}
        <textarea
          name="safetyNote"
          defaultValue={initial?.safetyNote}
          rows={2}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold">{t("typeTags")}</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {Object.values(MealTypeTag).map((tag) => (
            <label key={tag} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                name="typeTags"
                value={tag}
                defaultChecked={initial?.typeTags.includes(tag)}
              />
              {tType(tag)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">{t("effortTags")}</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {Object.values(MealEffortTag).map((tag) => (
            <label key={tag} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                name="effortTags"
                value={tag}
                defaultChecked={initial?.effortTags.includes(tag)}
              />
              {tEffort(tag)}
            </label>
          ))}
        </div>
      </fieldset>

      <ComponentPicker initial={initial?.components ?? []} />

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {t("submit")}
      </button>
    </form>
  );
}
