"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/types/catalog";
import { formatCurrency, normalizeSearch } from "@/lib/utils";

export function SearchBox({ products, large = false }: { products: Product[]; large?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalized = normalizeSearch(query);

  const matches = useMemo(() => {
    if (normalized.length < 2) {
      return [];
    }

    return products
      .filter((product) => {
        const haystack = normalizeSearch(
          [product.name, product.sku, product.brand.name, product.category.name, ...product.keywords].join(" ")
        );
        return normalized.split(" ").every((part) => haystack.includes(part));
      })
      .slice(0, 6);
  }, [normalized, products]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(`/products${query ? `?q=${encodeURIComponent(query)}` : ""}` as any);
  }

  return (
    <div className="relative w-full">
      <form
        onSubmit={submit}
        role="search"
        className="flex w-full flex-col gap-2 rounded-lg border border-border bg-white p-2 shadow-soft sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, SKU, brand, category"
            className={large ? "h-12 pl-10 text-base" : "pl-10"}
            aria-label="Search products"
          />
        </div>
        <Button type="submit" size={large ? "lg" : "default"}>
          Search
        </Button>
      </form>

      {matches.length ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-lg border border-border bg-white shadow-soft">
          <div className="grid max-h-96 overflow-auto p-2">
            {matches.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="grid grid-cols-[64px_1fr] gap-3 rounded-md p-2 hover:bg-secondary focus-ring"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
                  <Image src={product.images[0]?.url} alt={product.name} fill className="object-cover" sizes="64px" />
                </div>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{product.name}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {product.sku} - {product.category.name} - {formatCurrency(product.price)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
