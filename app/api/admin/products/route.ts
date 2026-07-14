import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getUniqueProductSlug,
  normalizeProductPayload,
  productSchema,
} from "@/lib/admin/products";
import connectToDatabase from "@/lib/db/mongodb";
import { Product as ProductModel } from "@/lib/models/Product";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = productSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill all required product fields." },
      { status: 400 },
    );
  }

  const normalized = normalizeProductPayload(parsed.data);
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  if (session.demo) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  try {
    await connectToDatabase();
    
    const product = parsed.data;
    const slug = await getUniqueProductSlug(product.name);
    
    const newProduct = await ProductModel.create({
      ...normalized.record,
      slug,
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${newProduct.slug}`);

    return NextResponse.json({ ok: true, id: newProduct._id.toString(), slug: newProduct.slug });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not create product" },
      { status: 500 },
    );
  }
}
