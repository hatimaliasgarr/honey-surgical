import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getUniqueProductSlug,
  normalizeStatus,
  parseSpecifications,
  sanitizeImageUrls,
  splitList,
} from "@/lib/admin/products";
import connectToDatabase from "@/lib/db/mongodb";
import { Product as ProductModel } from "@/lib/models/Product";
import { Category as CategoryModel } from "@/lib/models/Category";
import { Brand as BrandModel } from "@/lib/models/Brand";
import mongoose from "mongoose";

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

  if (session.demo) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      count: parsed.data.rows.length,
    });
  }

  try {
    await connectToDatabase();
    
    const [categories, brands] = await Promise.all([
      CategoryModel.find().select("_id name slug").lean(),
      BrandModel.find().select("_id name slug").lean(),
    ]);

    const categoryLookup = new Map<string, string>();
    categories.forEach((cat: any) => {
      const idStr = cat._id.toString();
      categoryLookup.set(lookupKey(idStr), idStr);
      categoryLookup.set(lookupKey(cat.name), idStr);
      categoryLookup.set(lookupKey(cat.slug), idStr);
    });

    const brandLookup = new Map<string, string>();
    brands.forEach((brand: any) => {
      const idStr = brand._id.toString();
      brandLookup.set(lookupKey(idStr), idStr);
      brandLookup.set(lookupKey(brand.name), idStr);
      brandLookup.set(lookupKey(brand.slug), idStr);
    });

    const skipped: string[] = [];
    const rowsToImport: any[] = [];
    const skusToImport: string[] = [];

    parsed.data.rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const name = cell(row, ["name", "product name", "product_name"]);
      const sku = cell(row, ["sku"]);
      const categoryValue = cell(row, [
        "category_id", "category id", "category", "category name", "category_name", "category slug", "category_slug",
      ]);
      const brandValue = cell(row, [
        "brand_id", "brand id", "brand", "brand name", "brand_name", "brand slug", "brand_slug",
      ]);
      const categoryId = categoryLookup.get(lookupKey(categoryValue));
      const brandId = brandLookup.get(lookupKey(brandValue));
      const priceValue = cell(row, ["price"]);
      const price = priceValue ? Number(priceValue) : null;
      const specificationText = cell(row, ["specifications", "specification", "specs"]);
      const specifications = parseSpecifications(specificationText);
      const imageText = cell(row, ["images", "image", "image_url", "image url", "image urls", "image_urls"]);

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

      const rawImageUrls = imageText ? sanitizeImageUrls(splitList(imageText)) : [];
      const images = rawImageUrls.map((url, i) => ({
        id: `img_${sku}_${i}`,
        url,
        alt: name,
        sortOrder: i + 1
      }));

      skusToImport.push(sku);
      rowsToImport.push({
        name,
        sku,
        category: new mongoose.Types.ObjectId(categoryId),
        brand: new mongoose.Types.ObjectId(brandId),
        price,
        shortDescription: cell(row, ["short_description", "short description", "short_desc"]) || name,
        description: cell(row, ["description"]) || name,
        specifications: specifications.value,
        features: splitList(cell(row, ["features"])),
        keywords: splitList(cell(row, ["keywords"])),
        status: normalizeStatus(cell(row, ["status"]).toLowerCase()),
        images
      });
    });

    if (!rowsToImport.length) {
      return NextResponse.json(
        { error: "No valid products found.", skipped },
        { status: 400 },
      );
    }

    const existingProducts = await ProductModel.find({ sku: { $in: skusToImport } }).select("_id sku").lean();
    const existingBySku = new Map(existingProducts.map((p: any) => [p.sku, p._id.toString()]));
    
    const reservedSlugs = new Set<string>();
    const bulkOperations = [];

    for (const row of rowsToImport) {
      const existingId = existingBySku.get(row.sku);
      const slug = await getUniqueProductSlug(row.name, existingId);
      row.slug = reserveSlug(slug, reservedSlugs);
      
      bulkOperations.push({
        updateOne: {
          filter: { sku: row.sku },
          update: { $set: row },
          upsert: true
        }
      });
    }

    await ProductModel.bulkWrite(bulkOperations);

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return NextResponse.json({ ok: true, count: rowsToImport.length, skipped });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not import products" },
      { status: 500 },
    );
  }
}
