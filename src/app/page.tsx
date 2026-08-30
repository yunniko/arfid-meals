import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/auth-actions";

export default async function Home() {
  const t = await getTranslations("Home");
  const session = await auth();

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">{t("heading")}</h1>
      <p className="max-w-md text-black/70 dark:text-white/70">{t("tagline")}</p>
      {session?.user ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-black/60 dark:text-white/60">{session.user.email}</p>
          <form action={logoutAction}>
            <button type="submit" className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/15">
              Logout
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/15"
          >
            {t("loginLink")}
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            {t("registerLink")}
          </Link>
        </div>
      )}
    </main>
  );
}
