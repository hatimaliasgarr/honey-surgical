import { NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db/mongodb";
import { Inquiry as InquiryModel } from "@/lib/models/Inquiry";
import mongoose from "mongoose";

const inquirySchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  productId: z.string().nullable().optional(),
  productName: z.string().nullable().optional(),
  message: z.string().min(5)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid inquiry payload" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    
    await InquiryModel.create({
      customerName: parsed.data.customerName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      productId: parsed.data.productId ? new mongoose.Types.ObjectId(parsed.data.productId) : null,
      productName: parsed.data.productName || null,
      message: parsed.data.message,
      status: "new"
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // If DB fails, we can fall back to demo response for now or just return error
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        ok: true,
        mode: "demo",
        message: "Inquiry accepted locally. Configure MONGODB_URI to persist inquiries."
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
