import { getTranslations } from "next-intl/server";

type Nutrients = {
  kcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  sugarG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
};

export async function NutritionFacts({ nutrients }: { nutrients: Nutrients }) {
  const t = await getTranslations("Nutrition");
  const rows: [string, number | null, string][] = [
    [t("kcal"), nutrients.kcal, ""],
    [t("protein"), nutrients.proteinG, "g"],
    [t("fat"), nutrients.fatG, "g"],
    [t("carbs"), nutrients.carbsG, "g"],
    [t("sugar"), nutrients.sugarG, "g"],
    [t("fiber"), nutrients.fiberG, "g"],
    [t("sodium"), nutrients.sodiumMg, "mg"],
  ];
  return (
    <div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value, unit]) => (
            <tr key={label} className="border-b border-black/10 dark:border-white/10">
              <td className="py-1 pr-4 text-black/60 dark:text-white/60">{label}</td>
              <td className="py-1 text-right font-medium">
                {value === null ? t("unknown") : `${value}${unit}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-black/50 dark:text-white/50">{t("perHundredGrams")}</p>
    </div>
  );
}
