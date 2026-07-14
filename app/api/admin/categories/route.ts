import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import connectToDatabase from "@/lib/db/mongodb";
import { Category as CategoryModel } from "@/lib/models/Category";
import { slugify } from "@/lib/utils";
import mongoose from "mongoose";

const categorySchema = z.object({
  name: z.string().min(2),
  parentId: z.string().nullable().optional(),
  description: z.string().min(5),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().min(0).default(1)
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category payload" }, { status: 400 });
  }

  if (session.demo) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  try {
    await connectToDatabase();
    
    const category = parsed.data;
    await CategoryModel.create({
      name: category.name,
      slug: slugify(category.name),
      parentId: category.parentId ? new mongoose.Types.ObjectId(category.parentId) : null,
      description: category.description,
      imageUrl: category.imageUrl || "",
      sortOrder: category.sortOrder
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
