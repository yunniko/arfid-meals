"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Kind = "ingredient" | "product";
type SelectedComponent = { kind: Kind; id: string; name: string; quantityG: number };
type SearchResult = { id: string; name: string; brand?: string | null };

function useDebouncedSearch(kind: Kind, query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/search/${kind}s?q=${encodeURIComponent(query)}`);
      if (res.ok && !cancelled) setResults(await res.json());
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [kind, query]);
  // Query cleared -> show nothing without a synchronous setState-in-effect
  // (the stale `results` state is simply not rendered in that case).
  return query.trim() ? results : [];
}

function PickerColumn({
  kind,
  heading,
  onAdd,
}: {
  kind: Kind;
  heading: string;
  onAdd: (kind: Kind, result: SearchResult) => void;
}) {
  const t = useTranslations("Admin.meals.form");
  const [query, setQuery] = useState("");
  const results = useDebouncedSearch(kind, query);
  return (
    <div>
      <h3 className="text-sm font-semibold">{heading}</h3>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("componentSearchPlaceholder")}
        className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
      />
      {results.length > 0 && (
        <ul className="mt-1 max-h-40 overflow-auto rounded-md border border-black/10 dark:border-white/10">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onAdd(kind, r)}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                {r.name}
                {r.brand ? ` — ${r.brand}` : ""}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
        <PickerColumn kind="ingredient" heading={t("ingredientsHeading")} onAdd={addComponent} />
        <PickerColumn kind="product" heading={t("productsHeading")} onAdd={addComponent} />
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
