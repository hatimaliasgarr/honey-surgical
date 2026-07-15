"use client";

import { ReactNode, useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

const key = "honey-surgicals-compare";

function getStoredItems() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]") as string[];
  } catch {
    return [];
  }
}

export function CompareToggle({
  productSlug,
  productName,
  children
}: {
  productSlug: string;
  productName: string;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    setSelected(getStoredItems().includes(productSlug));
  }, [productSlug]);

  function toggle() {
    const current = getStoredItems();
    const next = current.includes(productSlug)
      ? current.filter((item) => item !== productSlug)
      : [...current, productSlug].slice(-4);

    window.localStorage.setItem(key, JSON.stringify(next));
    setSelected(next.includes(productSlug));
    window.dispatchEvent(new CustomEvent("compare-updated", { detail: next }));
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      className={`size-8 rounded-full border shadow-sm backdrop-blur focus-ring sm:size-9 [&_svg]:size-4 ${
        selected
          ? "bg-medical-deep text-white border-medical-deep hover:bg-medical-deep/90"
          : "bg-white/90 text-muted-foreground border-border/85 hover:bg-secondary hover:text-foreground"
      }`}
      aria-label={`${selected ? "Remove" : "Add"} ${productName} ${selected ? "from" : "to"} comparison`}
      title={selected ? "Remove from compare" : "Compare product"}
    >
      {children}
    </Button>
  );
}

export function ProductDetailCompare({
  productSlug,
  productName
}: {
  productSlug: string;
  productName: string;
}) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    setSelected(getStoredItems().includes(productSlug));
    const handleUpdate = () => setSelected(getStoredItems().includes(productSlug));
    window.addEventListener("compare-updated", handleUpdate);
    return () => window.removeEventListener("compare-updated", handleUpdate);
  }, [productSlug]);

  function toggle() {
    const current = getStoredItems();
    const next = current.includes(productSlug)
      ? current.filter((item) => item !== productSlug)
      : [...current, productSlug].slice(-4);

    window.localStorage.setItem(key, JSON.stringify(next));
    setSelected(next.includes(productSlug));
    window.dispatchEvent(new CustomEvent("compare-updated", { detail: next }));
  }

  return (
    <Button
      type="button"
      variant={selected ? "destructive" : "outline"}
      size="lg"
      onClick={toggle}
      className="w-full sm:w-auto justify-center"
    >
      <Scale className="mr-2 h-5 w-5" aria-hidden="true" />
      {selected ? "Remove from Compare" : "Add to Compare"}
    </Button>
  );
}
