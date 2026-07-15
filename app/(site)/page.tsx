import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Headphones, MapPin, Medal, ShieldCheck, Tags } from "lucide-react";
import { BannerSlider } from "@/components/home/banner-slider";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/catalog/category-card";
import { InquiryForm } from "@/components/catalog/inquiry-form";
import { ProductCard } from "@/components/catalog/product-card";
import { SearchBox } from "@/components/catalog/search-box";
import { getFeaturedCategories, getFeaturedProducts, searchProducts } from "@/lib/repositories/catalog-repository";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "HONEY SURGICALS – Premium Medical & Surgical Sourcing Catalog",
  description: "HONEY SURGICALS is a leading supplier of surgical products, hospital furniture, diagnostics, rehabilitation aids, and disposable medical supplies. Request bulk quotes online.",
  alternates: {
    canonical: "/"
  }
};

const reasons = [
  { title: "Trusted Supplier", text: "Trusted sourcing for hospitals, clinics, laboratories, and distributors.", icon: ShieldCheck },
  { title: "Quality Products", text: "Catalogued products with specifications, brands, SKU references, and sourcing notes.", icon: BadgeCheck },
  { title: "Genuine Brands", text: "Brand-led discovery across disposables, diagnostics, equipment, and furniture.", icon: Medal },
  { title: "Competitive Pricing", text: "Quote-led procurement support for volume requirements and institutional buying.", icon: Tags },
  { title: "Customer Support", text: "Phone, email, WhatsApp, and direct inquiry flows for procurement teams.", icon: Headphones }
];

const testimonials = [
  {
    quote: "The catalog makes repeat procurement faster because our team can find SKUs and compare specifications before calling sales.",
    name: "Procurement Lead",
    org: "Multispeciality Hospital"
  },
  {
    quote: "HONEY SURGICALS gives our clinic a clean way to shortlist disposables and equipment without confusing e-commerce flows.",
    name: "Clinic Administrator",
    org: "Day Care Surgery Center"
  }
];

export default async function HomePage() {
  const [featuredCategories, featuredProducts, allProducts] = await Promise.all([
    getFeaturedCategories(),
    getFeaturedProducts(),
    searchProducts()
  ]);

  return (
    <>
      <section className="bg-white">
        <div className="container grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-14">
          <div className="grid gap-6">
            <div className="grid gap-4">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">HONEY SURGICALS</p>
              <h1 className="text-4xl font-bold tracking-normal text-medical-deep sm:text-5xl">
                HONEY SURGICALS – Surgical Products Catalog
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Search, browse, compare, and inquire about medical disposables, surgical instruments,
                equipment, diagnostics, hospital furniture, and infection control supplies.
              </p>
            </div>
            <SearchBox products={allProducts} large />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto justify-center">
                <Link href="/categories">
                  Browse Categories
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto justify-center">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
          <BannerSlider />
        </div>
      </section>

      <section className="section-band">
        <div className="container py-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-normal">Featured Categories</h2>
              <p className="mt-2 text-muted-foreground">A complete hierarchy for medical procurement discovery.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/categories">View all categories</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featuredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container py-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-normal">Featured Products</h2>
              <p className="mt-2 text-muted-foreground">High-interest products with quote-ready product pages.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/products">Browse catalog</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container py-12">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-normal">Why Choose Us</h2>
            <p className="mt-2 text-muted-foreground">A healthcare-focused catalog experience for procurement teams and healthcare professionals.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <div key={reason.title} className="rounded-lg border border-border bg-white p-5 shadow-sm">
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold">{reason.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{reason.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container grid gap-8 py-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <h2 className="text-2xl font-bold tracking-normal">Testimonials</h2>
            <div className="mt-6 grid gap-4">
              {testimonials.map((testimonial) => (
                <figure key={testimonial.name} className="rounded-lg border border-border bg-white p-5 shadow-sm">
                  <blockquote className="text-sm leading-6 text-muted-foreground">{testimonial.quote}</blockquote>
                  <figcaption className="mt-4 text-sm font-semibold">
                    {testimonial.name}
                    <span className="block font-normal text-muted-foreground">{testimonial.org}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-lg border border-border bg-medical-pale p-5">
              <h2 className="text-2xl font-bold tracking-normal">Contact Information</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
                <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" rel="noreferrer">
                  WhatsApp Sales
                </a>
                <a className="flex gap-2" href={siteConfig.mapsUrl} target="_blank" rel="noreferrer">
                  <MapPin className="size-4" aria-hidden="true" />
                  {siteConfig.address}
                </a>
              </div>
            </div>
            <InquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}
