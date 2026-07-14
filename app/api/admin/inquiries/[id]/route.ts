import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import connectToDatabase from "@/lib/db/mongodb";
import { Inquiry as InquiryModel } from "@/lib/models/Inquiry";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "closed"])
});

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (session.demo) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  try {
    const { id } = await context.params;
    await connectToDatabase();
    
    const updated = await InquiryModel.findByIdAndUpdate(id, { status: parsed.data.status });
    
    if (!updated) {
       return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
