"use client";

import { useRef, useTransition } from "react";

// Client half of the language switcher: submits the locale server action on
// change (no separate save button).
export function LocaleSelect({
  current,
  options,
  action,
  label,
}: {
  current: string;
  options: { code: string; label: string }[];
  action: (formData: FormData) => Promise<void>;
  label: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} action={action}>
      {/* Keyed on the server-derived locale, matching the portfolio pattern:
          React only applies defaultValue on mount, so without this key the
          select would silently revert to the old option after the server
          action's re-render. */}
      <select
        key={current}
        name="locale"
        aria-label={label}
        defaultValue={current}
        disabled={pending}
        onChange={() =>
          startTransition(() => {
            formRef.current?.requestSubmit();
          })
        }
        className="rounded-md border border-black/15 bg-white px-2 py-1 text-xs text-black/70 dark:border-white/15 dark:bg-black dark:text-white/70"
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
