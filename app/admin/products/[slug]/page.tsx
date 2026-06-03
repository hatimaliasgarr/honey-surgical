import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllBrands, getAllCategories, getProductBySlug } from "@/lib/repositories/catalog-repository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminProductEditPage({ params }: PageProps) {
  const { slug } = await params;
  const [session, categories, brands, product] = await Promise.all([
    requireAdmin(),
    getAllCategories(),
    getAllBrands(),
    getProductBySlug(slug, { includeInactive: true })
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AdminShell session={session}>
      <ProductForm categories={categories} brands={brands} product={product} />
    </AdminShell>
  );
}
