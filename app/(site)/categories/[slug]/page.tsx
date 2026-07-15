import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { getAllCategories, searchProducts } from "@/lib/repositories/catalog-repository";
import { BreadcrumbsJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/config/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.replace(/_/g, "-");
  const categories = await getAllCategories();
  const category = categories.find((item) => item.slug === normalizedSlug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  const titleText = `${category.name} | Surgical Supplies & Medical Equipment`;
  const descText = category.description || `Source quality ${category.name} products from HONEY SURGICALS. Browse our catalog and request institutional quotes.`;

  return {
    title: titleText,
    description: descText,
    alternates: {
      canonical: `/categories/${category.slug}`
    },
    openGraph: {
      title: titleText,
      description: descText,
      url: `${siteConfig.url}/categories/${category.slug}`,
      images: category.imageUrl ? [category.imageUrl] : ["/logo.jpeg"]
    }
  };
}

export default async function CategoryDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.replace(/_/g, "-");
  const categories = await getAllCategories();
  const category = categories.find((item) => item.slug === normalizedSlug);

  if (!category) {
    notFound();
  }

  const products = await searchProducts({ category: category.slug, sort: "popular" });
  const children = categories.filter((item) => item.parentId === category.id);

  const breadcrumbItems = [
    { name: "Home", item: siteConfig.url },
    { name: "Categories", item: `${siteConfig.url}/categories` },
    { name: category.name, item: `${siteConfig.url}/categories/${category.slug}` }
  ];

  const itemListItems = products.map((product, index) => ({
    name: product.name,
    url: `${siteConfig.url}/products/${product.slug}`,
    position: index + 1
  }));

  return (
    <section className="bg-white">
      <BreadcrumbsJsonLd items={breadcrumbItems} />
      {products.length > 0 && <ItemListJsonLd items={itemListItems} />}
      
      <div className="container grid gap-8 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-medical-deep">{category.name}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
        </div>

        {children.length ? (
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <a
                key={child.id}
                href={`/categories/${child.slug}`}
                className="rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium hover:bg-medical-pale focus-ring"
              >
                {child.name}
              </a>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
