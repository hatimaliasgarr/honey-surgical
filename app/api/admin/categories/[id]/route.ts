import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import connectToDatabase from "@/lib/db/mongodb";
import { Category as CategoryModel } from "@/lib/models/Category";
import { Product as ProductModel } from "@/lib/models/Product";
import { slugify } from "@/lib/utils";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const categorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
  description: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")).or(z.null()),
  sortOrder: z.coerce.number().min(0).default(1)
});

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid category payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (session.demo) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  try {
    await connectToDatabase();

    const category = parsed.data;

    // Check if parent category exists and is not itself to prevent cycle
    if (category.parentId) {
      if (category.parentId === id) {
        return NextResponse.json({ error: "A category cannot be its own parent." }, { status: 400 });
      }
      const parentExists = await CategoryModel.findById(category.parentId);
      if (!parentExists) {
        return NextResponse.json({ error: "Parent category not found." }, { status: 400 });
      }
    }

    const updated = await CategoryModel.findByIdAndUpdate(
      id,
      {
        name: category.name,
        slug: slugify(category.name),
        parentId: category.parentId ? new mongoose.Types.ObjectId(category.parentId) : null,
        description: category.description,
        imageUrl: category.imageUrl || "",
        sortOrder: category.sortOrder
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    revalidatePath("/admin/categories");
    revalidatePath("/categories");

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

    // Check if there are subcategories
    const hasSubcategories = await CategoryModel.exists({ parentId: id });
    if (hasSubcategories) {
      return NextResponse.json(
        { error: "Cannot delete category because it has subcategories. Please delete or reassign subcategories first." },
        { status: 400 }
      );
    }

    // Check if there are associated products
    const hasProducts = await ProductModel.exists({ category: id });
    if (hasProducts) {
      return NextResponse.json(
        { error: "Cannot delete category because it has associated products. Please reassign or delete the products first." },
        { status: 400 }
      );
    }

    const deleted = await CategoryModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    revalidatePath("/admin/categories");
    revalidatePath("/categories");

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
