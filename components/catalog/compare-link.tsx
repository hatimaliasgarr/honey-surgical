"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const key = "honey-surgicals-compare";

function readItems() {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]") as string[];
  } catch {
    return [];
  }
}

export function CompareLink() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setItems(readItems());
    refresh();
    window.addEventListener("compare-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("compare-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const href = items.length ? `/compare?items=${items.join(",")}` : "/compare";

  return (
    <Button asChild variant="beige" size="sm" className="w-full sm:w-auto justify-center">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link href={href as any}>
        <Scale aria-hidden="true" />
        Compare {items.length ? `(${items.length})` : ""}
      </Link>
    </Button>
  );
}
