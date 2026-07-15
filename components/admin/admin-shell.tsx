"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, FolderTree, Inbox, LayoutDashboard, Menu, Tag, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminSession } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/bulk-upload", label: "Bulk Upload", icon: Upload },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 }
];

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white p-4 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-medical-deep text-lg">Admin Panel</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge variant="beige" className="bg-medical-bluePale/30 text-medical-deep border border-medical-blue/20">
              {session.role.replace("_", " ")}
            </Badge>
            {session.demo ? (
              <Badge variant="secondary" className="text-[10px]">
                Demo data
              </Badge>
            ) : null}
          </div>
        </div>
        {/* Close button inside mobile menu */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 rounded-md hover:bg-secondary focus-ring text-muted-foreground"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="grid gap-1.5" aria-label="Admin navigation">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={item.href as any}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-ring",
                isActive
                  ? "bg-medical-deep text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <section className="bg-background min-h-[calc(100vh-8rem)]">
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-white/95 backdrop-blur px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-secondary focus-ring text-medical-deep"
            aria-label="Open administration menu"
          >
            <Menu className="size-5.5" />
          </button>
          <span className="font-bold text-sm text-medical-deep">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="beige" className="bg-medical-bluePale/30 text-medical-deep text-[10px] border border-medical-blue/20">
            {session.role.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Backdrop for Mobile Sidebar Drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sliding Mobile Navigation Drawer */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 top-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-white shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      <div className="container py-6 lg:py-8">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
          {/* Permanent Desktop Sidebar */}
          <aside className="hidden lg:block rounded-xl border border-border bg-white p-4 shadow-sm h-fit sticky top-6">
            <SidebarContent />
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
