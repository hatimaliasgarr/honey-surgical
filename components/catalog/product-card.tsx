import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompareToggle } from "@/components/catalog/compare-toggle";
import type { Product } from "@/lib/types/catalog";
import { siteConfig } from "@/lib/config/site";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const whatsappText = encodeURIComponent(
    `Hello HONEY SURGICALS, I would like information regarding ${product.name}`
  );

  return (
    <article className="grid overflow-hidden rounded-lg border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Link href={`/products/${product.slug}`} className="group block h-full w-full focus-ring">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : null}
        </Link>
        <div className="absolute right-2 top-2 z-10">
          <CompareToggle productSlug={product.slug} productName={product.name}>
            <Scale aria-hidden="true" />
          </CompareToggle>
        </div>
      </div>
      <div className="grid gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="min-w-0">
          <Badge variant="beige" className="mb-2">
            {product.category.name}
          </Badge>
          <Link href={`/products/${product.slug}`} className="focus-ring">
            <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 sm:min-h-12 sm:text-base sm:leading-6">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{product.sku}</p>
        </div>
        <p className="hidden sm:line-clamp-2 sm:min-h-11 sm:text-sm sm:leading-6 sm:text-muted-foreground">
          {product.shortDescription}
        </p>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-sm font-bold text-medical-deep sm:text-base">{formatCurrency(product.price)}</span>
          <span className="text-[10px] text-muted-foreground sm:text-xs">{product.brand.name}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
          <Button
            asChild
            variant="outline"
            className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
          >
            <a href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappText}`} target="_blank" rel="noreferrer">
              <MessageCircle className="size-3.5 sm:size-4" aria-hidden="true" />
              WhatsApp
            </a>
          </Button>
          <Button
            asChild
            className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
          >
            <Link href={`/products/${product.slug}#inquiry`}>
              Quote
              <ArrowRight className="size-3.5 sm:size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
