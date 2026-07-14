import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllCategories } from "@/lib/repositories/catalog-repository";

export default async function AdminCategoriesPage() {
  const [session, categories] = await Promise.all([requireAdmin(), getAllCategories()]);

  return (
    <AdminShell session={session}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-medical-deep">Category Management</h1>
          <p className="mt-2 text-muted-foreground">Create and manage nested categories for product discovery.</p>
        </div>
        <CategoryForm categories={categories} />
      </div>
    </AdminShell>
  );
}
