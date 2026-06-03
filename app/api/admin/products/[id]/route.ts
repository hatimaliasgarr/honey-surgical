import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getUniqueProductSlug,
  normalizeProductPayload,
  productSchema,
  replaceProductImages
} from "@/lib/admin/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill all required product fields." }, { status: 400 });
  }

  const normalized = normalizeProductPayload(parsed.data);
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const product = parsed.data;
  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("id,slug")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: fetchError?.message || "Product not found" }, { status: 404 });
  }

  const slug = await getUniqueProductSlug(supabase, product.name, id);
  const { data, error } = await supabase
    .from("products")
    .update({
      ...normalized.record,
      slug,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,slug")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not update product" }, { status: 500 });
  }

  const imageError = await replaceProductImages(supabase, id, product.name, normalized.imageUrls);
  if (imageError) {
    return NextResponse.json({ error: imageError }, { status: 500 });
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${existing.slug}`);
  revalidatePath(`/admin/products/${data.slug}`);
  revalidatePath("/products");
  revalidatePath(`/products/${existing.slug}`);
  revalidatePath(`/products/${data.slug}`);

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return NextResponse.json({ ok: true });
}
