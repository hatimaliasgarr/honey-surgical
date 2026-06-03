import Link from "next/link";
import { BarChart3, Boxes, FolderTree, Inbox, LayoutDashboard, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminSession } from "@/lib/auth/admin";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/bulk-upload", label: "Bulk Upload", icon: Upload },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 }
];

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  return (
    <section className="section-band min-h-[calc(100vh-8rem)]">
      <div className="container grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h1 className="font-bold text-medical-deep">Admin Panel</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="beige">{session.role.replace("_", " ")}</Badge>
              {session.demo ? <Badge variant="secondary">Demo data</Badge> : null}
            </div>
          </div>
          <nav className="grid gap-1" aria-label="Admin navigation">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={item.href as any}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-ring"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
