import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { slugify } from "@/lib/utils";

export const productStatusValues = ["draft", "active", "archived"] as const;

const priceSchema = z.preprocess((value) => {
  if (value === "" || value == null) {
    return null;
  }

  return value;
}, z.coerce.number().min(0).nullable());

export const productSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().min(2),
  categoryId: z.string().trim().min(1),
  brandId: z.string().trim().min(1),
  price: priceSchema,
  shortDescription: z.string().trim().min(5),
  description: z.string().trim().min(5),
  specifications: z.string().optional(),
  features: z.string().optional(),
  keywords: z.string().optional(),
  status: z.enum(productStatusValues).default("active"),
  images: z.array(z.string()).default([]),
});

export type ProductPayload = z.infer<typeof productSchema>;

export type ProductRecord = {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  brand_id: string;
  price: number | null;
  short_description: string;
  description: string;
  specifications: { label: string; value: string }[];
  features: string[];
  keywords: string[];
  status: ProductPayload["status"];
};

type NormalizedProduct =
  | {
      ok: true;
      record: Omit<ProductRecord, "slug">;
      imageUrls: string[];
    }
  | {
      ok: false;
      error: string;
    };

export function splitList(value?: string) {
  return (value || "")
    .split(/\r?\n|,|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeImageUrls(images: string[]) {
  return images
    .map((image) => image.trim())
    .filter((image) => image && !image.startsWith("blob:"))
    .filter(
      (image) =>
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("/"),
    );
}

export function parseSpecifications(value?: string) {
  const text = (value || "").trim();
  if (!text) {
    return { ok: true as const, value: [] };
  }

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return {
        ok: false as const,
        error: "Specifications must be a JSON array.",
      };
    }

    const specifications = parsed
      .map((item) => ({
        label: String(item?.label || "").trim(),
        value: String(item?.value || "").trim(),
      }))
      .filter((item) => item.label && item.value);

    return { ok: true as const, value: specifications };
  } catch {
    return { ok: false as const, error: "Specifications JSON is not valid." };
  }
}

export function normalizeProductPayload(
  product: ProductPayload,
): NormalizedProduct {
  const specifications = parseSpecifications(product.specifications);
  if (!specifications.ok) {
    return specifications;
  }

  return {
    ok: true,
    record: {
      name: product.name,
      sku: product.sku,
      category_id: product.categoryId,
      brand_id: product.brandId,
      price: product.price,
      short_description: product.shortDescription,
      description: product.description,
      specifications: specifications.value,
      features: splitList(product.features),
      keywords: splitList(product.keywords),
      status: product.status,
    },
    imageUrls: sanitizeImageUrls(product.images),
  };
}

export function normalizeStatus(value: string) {
  return productStatusValues.includes(value as ProductPayload["status"])
    ? (value as ProductPayload["status"])
    : "active";
}

export async function getUniqueProductSlug(
  supabase: SupabaseClient,
  name: string,
  excludeProductId?: string,
) {
  const baseSlug = slugify(name) || `product-${Date.now()}`;
  const { data, error } = await supabase
    .from("products")
    .select("id,slug")
    .like("slug", `${baseSlug}%`);

  if (error || !data) {
    return baseSlug;
  }

  const taken = new Set(
    (data as { id: string; slug: string }[])
      .filter((row) => row.id !== excludeProductId)
      .map((row) => row.slug),
  );

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (taken.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export async function replaceProductImages(
  supabase: SupabaseClient,
  productId: string,
  productName: string,
  imageUrls: string[],
) {
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    return deleteError.message;
  }

  if (!imageUrls.length) {
    return null;
  }

  const { error: insertError } = await supabase.from("product_images").insert(
    imageUrls.map((url, index) => ({
      product_id: productId,
      url,
      alt: productName,
      sort_order: index + 1,
    })),
  );

  return insertError?.message || null;
}
