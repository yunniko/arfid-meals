import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("Register");
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">{t("heading")}</h1>
      <RegisterForm />
    </main>
  );
}
