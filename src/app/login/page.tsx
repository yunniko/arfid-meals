import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const t = await getTranslations("Login");
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">{t("heading")}</h1>
      <LoginForm />
    </main>
  );
}
