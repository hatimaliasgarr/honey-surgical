import { AdminShell } from "@/components/admin/admin-shell";
import { BrandForm } from "@/components/admin/brand-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllBrands } from "@/lib/repositories/catalog-repository";

export default async function AdminBrandsPage() {
  const [session, brands] = await Promise.all([requireAdmin(), getAllBrands()]);

  return (
    <AdminShell session={session}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-medical-deep">Brand Management</h1>
          <p className="mt-2 text-muted-foreground">Create and manage brands for product discovery.</p>
        </div>
        <BrandForm brands={brands} />
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-lg text-medical-deep mb-4">Brands</h2>
          
          {/* Mobile Card List View */}
          <div className="grid gap-4 md:hidden">
            {brands.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground border border-dashed rounded-xl bg-white">
                No brands found. Create one above.
              </div>
            ) : (
              brands.map((brand) => (
                <div 
                  key={brand.id} 
                  className="flex flex-col gap-2 rounded-xl border border-border/80 bg-medical-bluePale/5 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-sm text-medical-deep">
                      {brand.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground select-all bg-white border px-2 py-0.5 rounded">
                      {brand.slug}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      No brands found. Create one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">
                        {brand.name}
                      </TableCell>
                      <TableCell>{brand.slug}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
