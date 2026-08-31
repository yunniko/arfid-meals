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

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function NutritionFacts({
  nutrients,
  mode = "per100g",
  incompleteFields = [],
}: {
  nutrients: Nutrients;
  mode?: "per100g" | "total";
  incompleteFields?: string[];
}) {
  const t = await getTranslations("Nutrition");
  const rows: [string, number | null, string, string][] = [
    [mode === "total" ? t("kcalUnit") : t("kcal"), nutrients.kcal, "", "kcal"],
    [t("protein"), nutrients.proteinG, "g", "proteinG"],
    [t("fat"), nutrients.fatG, "g", "fatG"],
    [t("carbs"), nutrients.carbsG, "g", "carbsG"],
    [t("sugar"), nutrients.sugarG, "g", "sugarG"],
    [t("fiber"), nutrients.fiberG, "g", "fiberG"],
    [t("sodium"), nutrients.sodiumMg, "mg", "sodiumMg"],
  ];
  return (
    <div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value, unit, field]) => (
            <tr key={label} className="border-b border-black/10 dark:border-white/10">
              <td className="py-1 pr-4 text-black/60 dark:text-white/60">{label}</td>
              <td className="py-1 text-right font-medium">
                {value === null ? t("unknown") : `${round1(value)}${unit}`}
                {incompleteFields.includes(field) && "*"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {mode === "total" ? (
        incompleteFields.length > 0 && (
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">{t("incompleteTotal")}</p>
        )
      ) : (
        <p className="mt-1 text-xs text-black/50 dark:text-white/50">{t("perHundredGrams")}</p>
      )}
    </div>
  );
}
