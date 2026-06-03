import { AdminShell } from "@/components/admin/admin-shell";
import { ProductActions } from "@/components/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllBrands, getAllCategories, searchProducts } from "@/lib/repositories/catalog-repository";
import { formatCurrency } from "@/lib/utils";

export default async function AdminProductsPage() {
  const [session, products, categories, brands] = await Promise.all([
    requireAdmin(),
    searchProducts({ sort: "newest", status: "all" }),
    getAllCategories(),
    getAllBrands()
  ]);

  return (
    <AdminShell session={session}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-medical-deep">Product Management</h1>
          <p className="mt-2 text-muted-foreground">Create, edit, archive, and manage product image uploads.</p>
        </div>
        <ProductForm categories={categories} brands={brands} />
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Products</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
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
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{product.brand.name}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductActions productId={product.id} productSlug={product.slug} productName={product.name} />
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
