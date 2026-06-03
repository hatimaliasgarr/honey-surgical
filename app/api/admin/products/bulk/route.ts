import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getUniqueProductSlug,
  normalizeStatus,
  parseSpecifications,
  replaceProductImages,
  sanitizeImageUrls,
  splitList,
  type ProductRecord,
} from "@/lib/admin/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bulkSchema = z.object({
  rows: z.array(
    z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  ),
});

function cell(row: Record<string, unknown>, keys: string[]) {
  const entry = Object.entries(row).find(([key]) =>
    keys.includes(key.toLowerCase().trim()),
  );
  return entry ? String(entry[1] ?? "").trim() : "";
}

function lookupKey(value: string) {
  return value.toLowerCase().trim();
}

function buildLookup(rows: { id: string; name: string; slug: string }[]) {
  const lookup = new Map<string, string>();
  rows.forEach((row) => {
    lookup.set(lookupKey(row.id), row.id);
    lookup.set(lookupKey(row.name), row.id);
    lookup.set(lookupKey(row.slug), row.id);
  });
  return lookup;
}

function reserveSlug(slug: string, reserved: Set<string>) {
  if (!reserved.has(slug)) {
    reserved.add(slug);
    return slug;
  }

  let suffix = 2;
  while (reserved.has(`${slug}-${suffix}`)) {
    suffix += 1;
  }

  const reservedSlug = `${slug}-${suffix}`;
  reserved.add(reservedSlug);
  return reservedSlug;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bulk payload" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      count: parsed.data.rows.length,
    });
  }

  const [categoriesResult, brandsResult] = await Promise.all([
    supabase.from("categories").select("id,name,slug"),
    supabase.from("brands").select("id,name,slug"),
  ]);

  if (
    categoriesResult.error ||
    brandsResult.error ||
    !categoriesResult.data ||
    !brandsResult.data
  ) {
    return NextResponse.json(
      {
        error:
          categoriesResult.error?.message ||
          brandsResult.error?.message ||
          "Could not load categories or brands",
      },
      { status: 500 },
    );
  }

  const categoryLookup = buildLookup(categoriesResult.data);
  const brandLookup = buildLookup(brandsResult.data);
  const skipped: string[] = [];
  const imageUrlsBySku = new Map<string, string[]>();
  const rowsToImport: Omit<ProductRecord, "slug">[] = [];

  parsed.data.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = cell(row, ["name", "product name", "product_name"]);
    const sku = cell(row, ["sku"]);
    const categoryValue = cell(row, [
      "category_id",
      "category id",
      "category",
      "category name",
      "category_name",
      "category slug",
      "category_slug",
    ]);
    const brandValue = cell(row, [
      "brand_id",
      "brand id",
      "brand",
      "brand name",
      "brand_name",
      "brand slug",
      "brand_slug",
    ]);
    const categoryId = categoryLookup.get(lookupKey(categoryValue));
    const brandId = brandLookup.get(lookupKey(brandValue));
    const priceValue = cell(row, ["price"]);
    const price = priceValue ? Number(priceValue) : null;
    const specificationText = cell(row, [
      "specifications",
      "specification",
      "specs",
    ]);
    const specifications = parseSpecifications(specificationText);
    const imageText = cell(row, [
      "images",
      "image",
      "image_url",
      "image url",
      "image urls",
      "image_urls",
    ]);

    if (!name || !sku || !categoryId || !brandId) {
      skipped.push(`Row ${rowNumber}: missing name, SKU, category, or brand.`);
      return;
    }

    if (priceValue && Number.isNaN(price)) {
      skipped.push(`Row ${rowNumber}: price is not a number.`);
      return;
    }

    if (!specifications.ok) {
      skipped.push(`Row ${rowNumber}: ${specifications.error}`);
      return;
    }

    if (imageText) {
      imageUrlsBySku.set(sku, sanitizeImageUrls(splitList(imageText)));
    }

    rowsToImport.push({
      name,
      sku,
      category_id: categoryId,
      brand_id: brandId,
      price,
      short_description:
        cell(row, ["short_description", "short description", "short_desc"]) ||
        name,
      description: cell(row, ["description"]) || name,
      specifications: specifications.value,
      features: splitList(cell(row, ["features"])),
      keywords: splitList(cell(row, ["keywords"])),
      status: normalizeStatus(cell(row, ["status"]).toLowerCase()),
    });
  });

  if (!rowsToImport.length) {
    return NextResponse.json(
      { error: "No valid products found.", skipped },
      { status: 400 },
    );
  }

  const { data: existingProducts, error: existingError } = await supabase
    .from("products")
    .select("id,sku")
    .in(
      "sku",
      rowsToImport.map((row) => row.sku),
    );

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingBySku = new Map(
    (existingProducts || []).map((row) => [row.sku, row.id]),
  );
  const reservedSlugs = new Set<string>();
  const products: ProductRecord[] = [];

  for (const row of rowsToImport) {
    const slug = await getUniqueProductSlug(
      supabase,
      row.name,
      existingBySku.get(row.sku),
    );
    products.push({ ...row, slug: reserveSlug(slug, reservedSlugs) });
  }

  const { data: upsertedProducts, error } = await supabase
    .from("products")
    .upsert(products, { onConflict: "sku" })
    .select("id,sku,name,slug");

  if (error || !upsertedProducts) {
    return NextResponse.json(
      { error: error?.message || "Could not import products" },
      { status: 500 },
    );
  }

  for (const product of upsertedProducts) {
    const imageUrls = imageUrlsBySku.get(product.sku);
    if (!imageUrls) {
      continue;
    }

    const imageError = await replaceProductImages(
      supabase,
      product.id,
      product.name,
      imageUrls,
    );
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 500 });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return NextResponse.json({ ok: true, count: products.length, skipped });
}
