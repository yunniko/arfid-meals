"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addExclusionRuleAction, type ActionState } from "@/lib/exclusion-actions";

type Kind = "ingredient" | "product";
type SearchResult = { id: string; name: string; brand?: string | null };
type Selected = { kind: Kind; id: string; name: string };

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
  return query.trim() ? results : [];
}

function SearchColumn({
  kind,
  label,
  onPick,
}: {
  kind: Kind;
  label: string;
  onPick: (selected: Selected) => void;
}) {
  const t = useTranslations("Profile");
  const [query, setQuery] = useState("");
  const results = useDebouncedSearch(kind, query);
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        {label}
      </h4>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("itemSearchPlaceholder")}
        className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
      />
      {results.length > 0 && (
        <ul className="mt-1 max-h-40 overflow-auto rounded-md border border-black/10 dark:border-white/10">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onPick({ kind, id: r.id, name: r.name })}
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

export function ItemRuleForm() {
  const t = useTranslations("Profile");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addExclusionRuleAction,
    {},
  );
  const [selected, setSelected] = useState<Selected | null>(null);

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
            <SearchColumn kind="ingredient" label={t("itemLabel")} onPick={setSelected} />
            <SearchColumn kind="product" label={t("itemLabel")} onPick={setSelected} />
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
