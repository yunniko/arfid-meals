export function SearchForm({
  action,
  placeholder,
  buttonLabel,
  defaultValue,
}: {
  action: string;
  placeholder: string;
  buttonLabel: string;
  defaultValue: string;
}) {
  return (
    <form action={action} className="flex gap-2">
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
      />
      <button
        type="submit"
        className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
