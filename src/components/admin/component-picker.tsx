"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchCombobox, type SearchResult } from "@/components/search-combobox";

type Kind = "ingredient" | "product";
type SelectedComponent = { kind: Kind; id: string; name: string; quantityG: number };

export function ComponentPicker({ initial }: { initial: SelectedComponent[] }) {
  const t = useTranslations("Admin.meals.form");
  const [selected, setSelected] = useState<SelectedComponent[]>(initial);

  function addComponent(kind: Kind, result: SearchResult) {
    if (selected.some((c) => c.kind === kind && c.id === result.id)) return;
    setSelected((prev) => [...prev, { kind, id: result.id, name: result.name, quantityG: 100 }]);
  }

  function updateQuantity(index: number, quantityG: number) {
    setSelected((prev) => prev.map((c, i) => (i === index ? { ...c, quantityG } : c)));
  }

  function removeComponent(index: number) {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <input type="hidden" name="components" value={JSON.stringify(selected)} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">{t("ingredientsHeading")}</h3>
          <div className="mt-1">
            <SearchCombobox
              kind="ingredient"
              placeholder={t("componentSearchPlaceholder")}
              onSelect={(r) => addComponent("ingredient", r)}
            />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t("productsHeading")}</h3>
          <div className="mt-1">
            <SearchCombobox
              kind="product"
              placeholder={t("componentSearchPlaceholder")}
              onSelect={(r) => addComponent("product", r)}
            />
          </div>
        </div>
      </div>
      <h3 className="mt-4 text-sm font-semibold">{t("selectedHeading")}</h3>
      {selected.length === 0 ? (
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{t("noneSelected")}</p>
      ) : (
        <ul className="mt-1 divide-y divide-black/10 dark:divide-white/10">
          {selected.map((c, i) => (
            <li key={`${c.kind}-${c.id}`} className="flex items-center gap-3 py-2">
              <span className="flex-1 text-sm">{c.name}</span>
              <input
                type="number"
                min={1}
                value={c.quantityG}
                onChange={(e) => updateQuantity(i, Number(e.target.value))}
                className="w-20 rounded-md border border-black/15 px-2 py-1 text-sm dark:border-white/15 dark:bg-black"
              />
              <span className="text-xs text-black/50 dark:text-white/50">g</span>
              <button
                type="button"
                onClick={() => removeComponent(i)}
                className="text-xs text-red-700 underline dark:text-red-400"
              >
                {t("removeButton")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
