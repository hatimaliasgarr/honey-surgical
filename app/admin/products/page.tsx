import { AdminShell } from "@/components/admin/admin-shell";
import { ProductActions } from "@/components/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getAllBrands,
  getAllCategories,
  searchProducts,
  getAllTemplates,
} from "@/lib/repositories/catalog-repository";
import { formatCurrency } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const [session, products, categories, brands, templates] = await Promise.all([
    requireAdmin(),
    searchProducts({ query: q, sort: "newest", status: "all" }),
    getAllCategories(),
    getAllBrands(),
    getAllTemplates(),
  ]);

  return (
    <AdminShell session={session}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-medical-deep">
            Product Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create, edit, archive, and manage product image uploads.
          </p>
        </div>
        <ProductForm categories={categories} brands={brands} templates={templates} />
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="font-semibold text-lg text-medical-deep">Products</h2>
            <form method="GET" action="/admin/products" className="flex w-full max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q || ""}
                  placeholder="Search products..."
                  className="pl-9 focus-ring"
                />
              </div>
              <Button type="submit">Search</Button>
              {q && (
                <Button asChild variant="outline" size="icon">
                  <Link href="/admin/products" title="Clear search">
                    <X className="size-4" />
                  </Link>
                </Button>
              )}
            </form>
          </div>
          
          {/* Mobile Card List View */}
          <div className="mt-4 grid gap-4 md:hidden">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex flex-col gap-2 rounded-xl border border-border/80 bg-medical-bluePale/5 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-sm text-medical-deep leading-tight">
                    {product.name}
                  </span>
                  <Badge
                    variant={product.status === "active" ? "default" : "secondary"}
                    className="shrink-0 text-[10px]"
                  >
                    {product.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-2.5 mt-1">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">SKU / Brand</span>
                    <span className="font-mono text-muted-foreground select-all text-[11px] block">{product.sku}</span>
                    <span className="text-muted-foreground/80 block mt-0.5">{product.brand.name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Category / Price</span>
                    <div className="mb-1">
                      <Badge variant="beige" className="text-[9px] bg-medical-bluePale/30 text-medical-deep border border-medical-blue/20">
                        {product.category.name}
                      </Badge>
                    </div>
                    <span className="font-semibold text-foreground block">{formatCurrency(product.price)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-border/40 pt-2 mt-1">
                  <ProductActions
                    productId={product.id}
                    productSlug={product.slug}
                    productName={product.name}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="mt-4 hidden md:block overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{product.brand.name}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "active" ? "default" : "secondary"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductActions
                        productId={product.id}
                        productSlug={product.slug}
                        productName={product.name}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
