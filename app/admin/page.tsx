import { Boxes, FolderTree, Inbox, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/admin";
import { getDashboardMetrics } from "@/lib/repositories/catalog-repository";
import { formatCurrency } from "@/lib/utils";
import { SeedButton } from "@/components/admin/seed-button";
import { Badge } from "@/components/ui/badge";

const widgetIcons = [Boxes, FolderTree, Inbox, TrendingUp];

export default async function AdminDashboardPage() {
  const [session, metrics] = await Promise.all([requireAdmin(), getDashboardMetrics()]);
  const widgets = [
    { label: "Total Products", value: metrics.totalProducts },
    { label: "Total Categories", value: metrics.totalCategories },
    { label: "Total Inquiries", value: metrics.totalInquiries },
    { label: "Most Viewed", value: metrics.mostViewedProducts[0]?.viewCount || 0 }
  ];

  return (
    <AdminShell session={session}>
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-medical-deep">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Operational overview for catalog, inquiry, and product analytics.</p>
          </div>
          <SeedButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {widgets.map((widget, index) => {
            const Icon = widgetIcons[index];
            return (
              <div key={widget.label} className="rounded-lg border border-border bg-white p-5 shadow-sm">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <p className="mt-4 text-sm text-muted-foreground">{widget.label}</p>
                <p className="mt-1 text-3xl font-bold text-medical-deep">{widget.value}</p>
              </div>
            );
          })}
        </div>

        <DashboardCharts metrics={metrics} />

        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-lg text-medical-deep">Most Viewed Products</h2>
          
          {/* Mobile Card List View */}
          <div className="mt-4 grid gap-4 md:hidden">
            {metrics.mostViewedProducts.map((product) => (
              <div 
                key={product.id} 
                className="flex flex-col gap-2 rounded-xl border border-border/80 bg-medical-bluePale/5 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-sm text-medical-deep leading-tight">
                    {product.name}
                  </span>
                  <Badge variant="beige" className="shrink-0 text-[10px] bg-medical-bluePale/30 text-medical-deep border border-medical-blue/20">
                    {product.category.name}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-2.5 mt-1">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">SKU</span>
                    <span className="font-mono text-muted-foreground select-all text-[11px]">{product.sku}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Price</span>
                    <span className="font-semibold text-foreground">{formatCurrency(product.price)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-1 text-xs">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Total Views</span>
                  <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
                    {product.viewCount} views
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="mt-4 hidden md:block overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.mostViewedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.viewCount}</TableCell>
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
