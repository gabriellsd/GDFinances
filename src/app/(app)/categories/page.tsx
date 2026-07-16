import { listCategories } from "@/features/categories/actions";
import { CategoriesManager } from "@/features/categories/components/categories-manager";

export default async function CategoriesPage() {
  const categories = await listCategories();
  return <CategoriesManager categories={categories} />;
}
