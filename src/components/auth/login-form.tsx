"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type ActionState } from "@/lib/auth-actions";

export function LoginForm() {
  const t = useTranslations("Login");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      {state?.error && (
        <p role="alert" className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        {t("email")}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("password")}
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-3 py-2 text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {t("submit")}
      </button>
      <p className="text-sm text-black/60 dark:text-white/60">
        <Link href="/register" className="underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
