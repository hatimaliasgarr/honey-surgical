"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { primaryNav, siteConfig } from "@/lib/config/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur shadow-sm">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="HONEY SURGICALS home">
          <Image
            src="/logo.jpeg"
            alt="HONEY SURGICALS Logo"
            width={44}
            height={44}
            className="shrink-0 rounded-md object-contain"
            priority
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight sm:text-base" style={{ color: "#1A3A5C" }}>
              HONEY SURGICALS
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">Surgical Products Catalog</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-ring",
                pathname === item.href && "bg-secondary text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link href="/products">
              <Search aria-hidden="true" />
              Products
            </Link>
          </Button>
          <Button asChild size="sm">
            <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>
              <Phone aria-hidden="true" />
              Call Sales
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-white lg:hidden">
          <nav className="container grid gap-1 py-3" aria-label="Mobile navigation">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-ring",
                  pathname === item.href && "bg-secondary text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mt-2">
              <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>
                <Phone aria-hidden="true" />
                Call Sales
              </a>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
