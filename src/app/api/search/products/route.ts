import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/nutrition-queries";

// Backs the admin meal composer's product picker. Read-only, same data
// already public at /products — no auth needed to query it.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const products = await searchProducts(q);
  return NextResponse.json(
    products.map((p) => ({ id: p.id, name: p.name, brand: p.brand, kcal: p.kcal })),
  );
}
