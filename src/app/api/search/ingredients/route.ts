import { NextRequest, NextResponse } from "next/server";
import { searchIngredients } from "@/lib/nutrition-queries";

// Backs the admin meal composer's ingredient picker. Read-only, same data
// already public at /ingredients — no auth needed to query it.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const ingredients = await searchIngredients(q);
  return NextResponse.json(
    ingredients.map((i) => ({ id: i.id, name: i.name, kcal: i.kcal })),
  );
}
