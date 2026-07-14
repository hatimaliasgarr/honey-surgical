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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
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
    
    const existing = await ProductModel.findById(id).select("slug").lean();

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    const product = parsed.data;
    const slug = await getUniqueProductSlug(product.name, id);
    
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      {
        ...normalized.record,
        slug,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Could not update product" },
        { status: 500 },
      );
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${existing.slug}`);
    revalidatePath(`/admin/products/${updatedProduct.slug}`);
    revalidatePath("/products");
    revalidatePath(`/products/${existing.slug}`);
    revalidatePath(`/products/${updatedProduct.slug}`);

    return NextResponse.json({ ok: true, id: updatedProduct._id.toString(), slug: updatedProduct.slug });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  
  if (session.demo) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  try {
    await connectToDatabase();
    await ProductModel.findByIdAndDelete(id);

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
