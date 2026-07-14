import { z } from "zod";
import { slugify } from "@/lib/utils";
import connectToDatabase from "@/lib/db/mongodb";
import { Product as ProductModel } from "@/lib/models/Product";
import mongoose from "mongoose";

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
  category: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;
  price: number | null;
  shortDescription: string;
  description: string;
  specifications: { label: string; value: string }[];
  features: string[];
  keywords: string[];
  status: ProductPayload["status"];
  images: { id: string; url: string; alt: string; sortOrder: number }[];
};

type NormalizedProduct =
  | {
      ok: true;
      record: Omit<ProductRecord, "slug">;
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

  const imageUrls = sanitizeImageUrls(product.images);
  const images = imageUrls.map((url, index) => ({
    id: `img_${Date.now()}_${index}`, // Generate simple IDs for Cloudinary fallback
    url,
    alt: product.name,
    sortOrder: index + 1,
  }));

  return {
    ok: true,
    record: {
      name: product.name,
      sku: product.sku,
      category: new mongoose.Types.ObjectId(product.categoryId),
      brand: new mongoose.Types.ObjectId(product.brandId),
      price: product.price,
      shortDescription: product.shortDescription,
      description: product.description,
      specifications: specifications.value,
      features: splitList(product.features),
      keywords: splitList(product.keywords),
      status: product.status,
      images,
    }
  };
}

export function normalizeStatus(value: string) {
  return productStatusValues.includes(value as ProductPayload["status"])
    ? (value as ProductPayload["status"])
    : "active";
}

export async function getUniqueProductSlug(
  name: string,
  excludeProductId?: string,
) {
  await connectToDatabase();
  const baseSlug = slugify(name) || `product-${Date.now()}`;
  
  const query: any = { slug: { $regex: `^${baseSlug}` } };
  if (excludeProductId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeProductId) };
  }

  const products = await ProductModel.find(query).select("slug").lean();
  
  if (!products.length) {
    return baseSlug;
  }

  const taken = new Set(products.map((p: any) => p.slug));

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (taken.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}
