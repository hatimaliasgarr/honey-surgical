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

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const slug = await getUniqueProductSlug(supabase, product.name);
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...normalized.record,
      slug
    })
    .select("id,name,slug")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create product" }, { status: 500 });
  }

  const imageError = await replaceProductImages(supabase, data.id, product.name, normalized.imageUrls);
  if (imageError) {
    return NextResponse.json({ error: imageError }, { status: 500 });
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${data.slug}`);

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}
