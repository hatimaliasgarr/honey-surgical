import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Layers, MessageCircle } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { getAllCategories, searchProducts } from "@/lib/repositories/catalog-repository";
import { BreadcrumbsJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  const parent = category.parentId ? categories.find(c => c.id === category.parentId) : null;
  const titleText = parent 
    ? `${category.name} - ${parent.name} | ${siteConfig.name}` 
    : `${category.name} | Surgical Supplies & Medical Equipment`;
    
  const descText = category.description || `Source quality ${category.name} products from HONEY SURGICALS. Browse our catalog and request institutional quotes.`;
  const absoluteUrl = `${siteConfig.url}/categories/${category.slug}`;
  const imageUrl = category.imageUrl
    ? category.imageUrl.startsWith("http")
      ? category.imageUrl
      : `${siteConfig.url}${category.imageUrl}`
    : `${siteConfig.url}/logo.jpeg`;

  return {
    title: titleText,
    description: descText,
    alternates: {
      canonical: absoluteUrl
    },
    openGraph: {
      title: titleText,
      description: descText,
      url: absoluteUrl,
      images: [imageUrl]
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
  
  // Resolve Hierarchical Sibling Navigation
  const children = categories.filter((item) => item.parentId === category.id);
  const parentCategory = category.parentId 
    ? categories.find(item => item.id === category.parentId) 
    : null;
  const siblings = category.parentId 
    ? categories.filter((item) => item.parentId === category.parentId) 
    : [];

  // Determine pills to show
  const pills: { name: string; slug: string; isActive: boolean; ariaCurrent?: "page" }[] = [];

  if (!parentCategory) {
    // Top-level category
    pills.push({
      name: `All ${category.name}`,
      slug: category.slug,
      isActive: true,
      ariaCurrent: "page"
    });
    children.forEach((child) => {
      pills.push({
        name: child.name,
        slug: child.slug,
        isActive: false
      });
    });
  } else {
    // Subcategory page
    pills.push({
      name: `← All ${parentCategory.name}`,
      slug: parentCategory.slug,
      isActive: false
    });
    siblings.forEach((sib) => {
      const isActive = sib.slug === category.slug;
      pills.push({
        name: sib.name,
        slug: sib.slug,
        isActive: isActive,
        ariaCurrent: isActive ? "page" : undefined
      });
    });
  }

  // Visual & Schema Breadcrumbs
  const breadcrumbItems = [
    { name: "Home", item: siteConfig.url },
    { name: "Categories", item: `${siteConfig.url}/categories` }
  ];
  if (parentCategory) {
    breadcrumbItems.push({ name: parentCategory.name, item: `${siteConfig.url}/categories/${parentCategory.slug}` });
  }
  breadcrumbItems.push({ name: category.name, item: `${siteConfig.url}/categories/${category.slug}` });

  const itemListItems = products.map((product, index) => ({
    name: product.name,
    url: `${siteConfig.url}/products/${product.slug}`,
    position: index + 1
  }));

  const whatsappText = encodeURIComponent(
    `Hello HONEY SURGICALS, I am interested in products under the category "${category.name}" and would like to receive details.`
  );

  return (
    <section className="bg-background min-h-screen">
      <BreadcrumbsJsonLd items={breadcrumbItems} />
      {products.length > 0 && <ItemListJsonLd items={itemListItems} />}
      
      <div className="container py-8 space-y-8">
        {/* Visual Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-muted-foreground/80 font-medium">
          <Link href="/" className="hover:text-medical-deep transition-colors focus-ring rounded">Home</Link>
          <ChevronRight className="size-3 text-muted-foreground/40" />
          <Link href="/categories" className="hover:text-medical-deep transition-colors focus-ring rounded">Categories</Link>
          {parentCategory && (
            <>
              <ChevronRight className="size-3 text-muted-foreground/40" />
              <Link href={`/categories/${parentCategory.slug}`} className="hover:text-medical-deep transition-colors focus-ring rounded">{parentCategory.name}</Link>
            </>
          )}
          <ChevronRight className="size-3 text-muted-foreground/40" />
          <span className="text-medical-deep font-semibold" aria-current="page">{category.name}</span>
        </nav>

        {/* Premium Category Header Hero Section */}
        <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-medical-bluePale/30 via-white to-medical-greenPale/20 p-6 sm:p-8 md:p-10 shadow-sm">
          {/* Glassmorphism backing shapes */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 size-72 rounded-full bg-medical-blue/10 blur-3xl pointer-events-none opacity-40" />
          <div className="absolute left-0 bottom-0 -ml-16 -mb-16 size-72 rounded-full bg-medical-green/10 blur-3xl pointer-events-none opacity-40" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-medical-deep sm:text-4xl">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="mt-3 max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                )}
              </div>
              
              <div className="hidden md:block shrink-0 rounded-xl bg-white/60 backdrop-blur-sm border border-border/40 px-5 py-4 text-center min-w-28 shadow-sm">
                <span className="block text-2xl font-bold text-medical-deep font-mono">
                  {products.length}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Products
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Subcategory Pills - Mobile Scrollable & High Contrast */}
        {pills.length > 1 && (
          <nav aria-label="Subcategory navigation" className="w-full border-b border-border/40 pb-4">
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none sm:mx-0 sm:px-0 sm:flex-wrap gap-2">
              {pills.map((pill, index) => {
                return (
                  <Link
                    key={index}
                    href={`/categories/${pill.slug}`}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all focus-ring border",
                      pill.isActive
                        ? "bg-medical-deep text-white border-medical-deep shadow-sm font-semibold"
                        : "bg-white text-muted-foreground border-border/80 hover:bg-medical-bluePale/30 hover:text-medical-deep hover:border-medical-blue/30"
                    )}
                    aria-current={pill.ariaCurrent}
                  >
                    {pill.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Directory Header / Product List Grid Directory */}
        <div className="grid gap-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h2 className="text-lg font-bold tracking-tight text-medical-deep">
              Products <span className="text-sm font-normal text-muted-foreground">({products.length} items)</span>
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/85 rounded-2xl bg-white px-6">
              <div className="p-4 bg-medical-grey rounded-full mb-4">
                <Layers className="size-8 text-muted-foreground/60" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-medical-deep">No Products Found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm leading-relaxed">
                We currently don&apos;t have products cataloged in this category. We can procure medical items directly for your institute.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button asChild variant="outline">
                  <Link href="/categories">View Categories</Link>
                </Button>
                <Button asChild className="bg-medical-deep text-white hover:bg-medical-deep/90">
                  <a href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappText}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4 mr-2 text-white" aria-hidden="true" />
                    Inquire on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
