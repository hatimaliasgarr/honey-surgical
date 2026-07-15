import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InquiryForm } from "@/components/catalog/inquiry-form";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductGallery } from "@/components/catalog/product-gallery";
import {
  getProductBySlug,
  getRelatedProducts
} from "@/lib/repositories/catalog-repository";
import { siteConfig } from "@/lib/config/site";
import { formatCurrency } from "@/lib/utils";
import { BreadcrumbsJsonLd } from "@/components/seo/json-ld";
import { ProductDetailCompare } from "@/components/catalog/compare-toggle";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.replace(/_/g, "-");
  const product = await getProductBySlug(normalizedSlug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  const titleText = `${product.name} | Sourcing & Wholesale Price`;
  const descText = `${product.shortDescription || product.description}. Get bulk quotes for ${product.name} (${product.sku}). Check key specifications, brand details, and buy wholesale from HONEY SURGICALS.`;

  return {
    title: titleText,
    description: descText,
    alternates: {
      canonical: `/products/${product.slug}`
    },
    openGraph: {
      title: titleText,
      description: descText,
      url: `${siteConfig.url}/products/${product.slug}`,
      images: product.images[0]?.url ? [product.images[0].url] : ["/logo.jpeg"]
    }
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.replace(/_/g, "-");
  const product = await getProductBySlug(normalizedSlug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product);
  const whatsappText = encodeURIComponent(
    `Hello HONEY SURGICALS, I would like information regarding ${product.name}`
  );

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand.name
    },
    category: product.category.name,
    description: product.description || product.shortDescription,
    image: product.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price || undefined,
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/products/${product.slug}`
    }
  };

  const breadcrumbItems = [
    { name: "Home", item: siteConfig.url },
    { name: "Categories", item: `${siteConfig.url}/categories` },
    { name: product.category.name, item: `${siteConfig.url}/categories/${product.category.slug}` },
    { name: product.name, item: `${siteConfig.url}/products/${product.slug}` }
  ];

  return (
    <section className="bg-white">
      <BreadcrumbsJsonLd items={breadcrumbItems} />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="container grid gap-10 py-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <ProductGallery images={product.images} productName={product.name} />
          <div className="grid content-start gap-6">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="beige">{product.category.name}</Badge>
                <Badge variant="secondary">{product.brand.name}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-normal text-medical-deep sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-3 text-muted-foreground">{product.shortDescription}</p>
            </div>

            <div className="grid gap-3 rounded-lg border border-border bg-secondary p-4 sm:grid-cols-3">
              <div>
                <span className="text-xs uppercase tracking-normal text-muted-foreground">SKU</span>
                <p className="font-semibold">{product.sku}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-normal text-muted-foreground">Price</span>
                <p className="font-semibold text-medical-deep">{formatCurrency(product.price)}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-normal text-muted-foreground">Category</span>
                <p className="font-semibold">{product.category.name}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto justify-center">
                <a href="#inquiry">Request Quote</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto justify-center">
                <a href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappText}`} target="_blank" rel="noreferrer">
                  <MessageCircle aria-hidden="true" />
                  WhatsApp Inquiry
                </a>
              </Button>
              <Button asChild variant="beige" size="lg" className="w-full sm:w-auto justify-center">
                <Link href="/contact">
                  <Phone aria-hidden="true" />
                  Contact Sales
                </Link>
              </Button>
              <ProductDetailCompare productSlug={product.slug} productName={product.name} />
            </div>

            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Description</h2>
              <p className="leading-7 text-muted-foreground">{product.description}</p>
            </div>

            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Features</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <li key={feature} className="rounded-md bg-medical-pale px-3 py-2 text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Specifications</h2>
            <dl className="mt-4 grid divide-y divide-border">
              {product.specifications.map((spec) => (
                <div key={spec.label} className="grid gap-1 py-3 sm:grid-cols-[220px_1fr]">
                  <dt className="font-medium text-muted-foreground">{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div id="inquiry">
            <InquiryForm productId={product.id} productName={product.name} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-medical-pale p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Need procurement assistance?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Share quantities, delivery city, preferred brand, or technical specification.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="w-full sm:w-auto justify-center">
                <a href={`mailto:${siteConfig.email}`}>
                  <Mail aria-hidden="true" />
                  Email Sales
                </a>
              </Button>
              <Button asChild className="w-full sm:w-auto justify-center">
                <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>
                  <Phone aria-hidden="true" />
                  Call
                </a>
              </Button>
            </div>
          </div>
        </div>

        {related.length ? (
          <div>
            <h2 className="text-2xl font-bold tracking-normal">Related Products</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
