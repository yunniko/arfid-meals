-- AlterTable
ALTER TABLE "exclusion_rules" ADD COLUMN     "ingredientGroupId" TEXT;

-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "ingredientGroupId" TEXT;

-- CreateTable
CREATE TABLE "ingredient_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ingredient_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_groups_slug_key" ON "ingredient_groups"("slug");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_ingredientGroupId_fkey" FOREIGN KEY ("ingredientGroupId") REFERENCES "ingredient_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusion_rules" ADD CONSTRAINT "exclusion_rules_ingredientGroupId_fkey" FOREIGN KEY ("ingredientGroupId") REFERENCES "ingredient_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
