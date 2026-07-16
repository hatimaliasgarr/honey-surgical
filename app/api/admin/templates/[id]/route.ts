import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import connectToDatabase from "@/lib/db/mongodb";
import { ProductTemplate as ProductTemplateModel } from "@/lib/models/ProductTemplate";
import { slugify } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const specSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const templateSchema = z.object({
  name: z.string().min(1),
  shortDescription: z.string().optional().default(""),
  description: z.string().optional().default(""),
  specifications: z.array(specSchema).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  keywords: z.array(z.string()).optional().default([]),
});

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const payload = await request.json().catch(() => null);
  const parsed = templateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid template payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (session.demo) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  try {
    await connectToDatabase();

    const data = parsed.data;
    const updated = await ProductTemplateModel.findByIdAndUpdate(
      id,
      {
        name: data.name,
        slug: slugify(data.name),
        shortDescription: data.shortDescription,
        description: data.description,
        specifications: data.specifications,
        features: data.features,
        keywords: data.keywords,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    revalidatePath("/admin/templates");
    revalidatePath("/admin/products");

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

    const deleted = await ProductTemplateModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    revalidatePath("/admin/templates");
    revalidatePath("/admin/products");

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
