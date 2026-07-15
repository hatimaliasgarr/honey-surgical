import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompareToggle } from "@/components/catalog/compare-toggle";
import type { Product } from "@/lib/types/catalog";
import { siteConfig } from "@/lib/config/site";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const whatsappText = encodeURIComponent(
    `Hello HONEY SURGICALS, I am interested in sourcing "${product.name}" (SKU: ${product.sku}). Please share availability and bulk pricing for institutional procurement.`
  );

  return (
    <article className="group/card relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
      {/* Aspect Square Image container with scaling */}
      <div className="relative aspect-square w-full overflow-hidden bg-medical-grey/50">
        <Link 
          href={`/products/${product.slug}`} 
          className="block h-full w-full focus-ring"
          tabIndex={-1}
          aria-hidden="true"
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-contain p-4 transition-transform duration-500 ease-out group-hover/card:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
              <svg className="size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          )}
        </Link>
        
        {/* Comparison toggle badge overlay */}
        <div className="absolute right-2.5 top-2.5 z-10 opacity-90 transition-opacity hover:opacity-100">
          <CompareToggle productSlug={product.slug} productName={product.name}>
            <Scale className="size-4" aria-hidden="true" />
          </CompareToggle>
        </div>
      </div>

      {/* Content details and actions layout */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Brand & SKU info row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider truncate max-w-[60%]">
            {product.brand.name}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/60 select-all">
            {product.sku}
          </span>
        </div>

        {/* Title link */}
        <Link href={`/products/${product.slug}`} className="focus-ring mb-2 group/title">
          <h3 className="line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] text-xs font-semibold text-medical-deep leading-tight sm:text-sm md:text-base group-hover/title:text-medical-blue transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Short Description */}
        <p className="line-clamp-2 min-h-[1.75rem] text-[10px] text-muted-foreground leading-normal mb-3 sm:min-h-[2rem] sm:text-xs sm:mb-4">
          {product.shortDescription}
        </p>

        {/* Bottom row layout - Price and CTAs */}
        <div className="mt-auto pt-3 border-t border-border/40 flex flex-col gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider sm:text-[10px]">MSRP</span>
            <span className="text-sm font-bold text-medical-deep font-mono tracking-tight tabular-nums sm:text-base">
              {formatCurrency(product.price)}
            </span>
          </div>

          {/* Action layout */}
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 sm:gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 w-full justify-center text-[10px] font-semibold border-border/80 text-foreground hover:bg-medical-bluePale/20 hover:text-medical-blue hover:border-medical-blue/30 sm:h-9 sm:text-xs"
            >
              <a
                href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Inquire about ${product.name} on WhatsApp`}
              >
                <MessageCircle className="size-3.5 mr-1 text-medical-green sm:mr-1.5" aria-hidden="true" />
                WhatsApp
              </a>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-8 w-full justify-center text-[10px] font-semibold bg-medical-deep text-white hover:bg-medical-deep/90 sm:h-9 sm:text-xs"
            >
              <Link
                href={`/products/${product.slug}#inquiry`}
                aria-label={`Request quote for ${product.name}`}
              >
                Quote
                <ArrowRight className="size-3.5 ml-1 sm:ml-1.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
