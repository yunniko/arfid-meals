"use client";

import { useEffect, useRef, useState } from "react";

export type SearchResult = { id: string; name: string; brand?: string | null };

// A search-as-you-type box with a results dropdown. Used by both the meal
// composer (admin) and the profile exclusion-rule form for ingredient/
// product lookup — factored out here after both copies shipped with the
// same two real bugs: no feedback that a click actually selected
// something (the dropdown and query just sat there unchanged), and no way
// to close the dropdown by clicking away from it.
export function SearchCombobox({
  kind,
  placeholder,
  onSelect,
}: {
  kind: "ingredient" | "product";
  placeholder: string;
  onSelect: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
  // Query cleared -> render nothing without a synchronous setState-in-effect
  // (the stale `results` state is simply not rendered in that case).
  const visibleResults = query.trim() ? results : [];

  function handleSelect(result: SearchResult) {
    onSelect(result);
    // Clearing the query and closing the dropdown IS the feedback that
    // the click registered — without this, selecting a result looked
    // identical to not having clicked it at all.
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  // Closes the dropdown when focus leaves the input AND the results list
  // (a plain onBlur on just the input would fire before a result's click
  // is processed and close the list out from under it — checking
  // relatedTarget against the whole container avoids that).
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
      setIsOpen(false);
    }
  }

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} onBlur={handleBlur} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
      />
      {showDropdown && visibleResults.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-black">
          {visibleResults.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
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
