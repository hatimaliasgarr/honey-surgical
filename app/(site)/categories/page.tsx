import type { Metadata } from "next";
import { CategoryCard } from "@/components/catalog/category-card";
import { getCategoryTree } from "@/lib/repositories/catalog-repository";
import { BreadcrumbsJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Medical & Surgical Product Categories",
  description: "Browse our complete directory of surgical instruments, medical disposables, diagnostics, dental products, hospital furniture, and laboratory equipment.",
  alternates: {
    canonical: "/categories"
  }
};

export default async function CategoriesPage() {
  const categories = await getCategoryTree();

  const breadcrumbItems = [
    { name: "Home", item: siteConfig.url },
    { name: "Categories", item: `${siteConfig.url}/categories` }
  ];

  return (
    <section className="bg-white">
      <BreadcrumbsJsonLd items={breadcrumbItems} />
      <div className="container grid gap-8 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-medical-deep">Product Categories</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Browse a normalized hierarchy built for surgical, hospital, laboratory, dental, emergency,
            rehabilitation, and infection control procurement.
          </p>
        </div>
        <div className="grid gap-6">
          {categories.map((category) => (
            <section key={category.id} className="grid gap-4">
              <CategoryCard category={category} />
              {category.children?.length ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {category.children.map((child) => (
                    <CategoryCard key={child.id} category={child} />
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
